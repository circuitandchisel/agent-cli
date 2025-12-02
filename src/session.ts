import { AgentBridge, createAgentBridge, createUserMessage, type UserMessageInput } from './agent/bridge.js';
import { createMessageHandler } from './agent/messages.js';
import { InputHandler, createInputHandler } from './input/handler.js';
import { Renderer, createRenderer } from './output/renderer.js';
import type { Config, SessionState } from './types.js';
import type { CanUseTool, PermissionResult, PermissionUpdate } from '@anthropic-ai/claude-agent-sdk';

/**
 * Session manager - orchestrates the conversation lifecycle
 */
export class Session {
  private config: Config;
  private renderer: Renderer;
  private inputHandler: InputHandler;
  private agentBridge: AgentBridge;
  private state: SessionState;

  // Message queue for the generator
  private messageQueue: UserMessageInput[] = [];
  private messageResolvers: Array<(msg: UserMessageInput | null) => void> = [];
  private isRunning: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.renderer = createRenderer(config.ui);
    this.inputHandler = createInputHandler(config.ui.colorScheme);
    this.agentBridge = createAgentBridge({
      model: config.model,
      maxTurns: config.maxTurns,
      permissionMode: config.permissionMode,
      allowedTools: config.allowedTools,
      disallowedTools: config.disallowedTools,
      mcpServers: config.mcpServers,
      systemPrompt: config.systemPrompt,
      cwd: config.cwd || process.cwd(),
      includePartialMessages: true,
      canUseTool: this.handleCanUseTool.bind(this),
      // Pass through all environment variables to the SDK subprocess.
      // This is required because the SDK replaces (not merges) its default
      // process.env when a custom env object is provided. Gateway-related
      // vars like ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN must be
      // inherited along with critical system vars (PATH, HOME, etc.)
      env: {
        ...process.env,
      },
    });

    this.state = {
      isStreaming: false,
      pendingInterrupt: null,
      turnCount: 0,
    };

    // Handle interrupts from input
    this.inputHandler.onInterrupt((text) => {
      this.handleInterrupt(text);
    });
  }

  /**
   * Handle tool permission requests from the SDK
   */
  private async handleCanUseTool(
    toolName: string,
    input: Record<string, unknown>,
    options: {
      signal: AbortSignal;
      suggestions?: PermissionUpdate[];
      blockedPath?: string;
      decisionReason?: string;
      toolUseID: string;
      agentID?: string;
    }
  ): Promise<PermissionResult> {
    // Show the permission prompt
    this.renderer.showPermissionPrompt(toolName, input, options.decisionReason);

    // Wait for user response
    const response = await this.inputHandler.getPermissionInput();

    // Handle the response
    switch (response) {
      case 'yes':
        this.renderer.showPermissionResult(true, false);
        return {
          behavior: 'allow',
          updatedInput: input,
          toolUseID: options.toolUseID,
        };

      case 'always':
        this.renderer.showPermissionResult(true, true);
        return {
          behavior: 'allow',
          updatedInput: input,
          updatedPermissions: options.suggestions,
          toolUseID: options.toolUseID,
        };

      case 'no':
      default:
        this.renderer.showPermissionResult(false);
        return {
          behavior: 'deny',
          message: 'User denied permission for this tool',
          interrupt: false,
          toolUseID: options.toolUseID,
        };
    }
  }

  /**
   * Start the session
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Show welcome
    this.renderer.showWelcome('1.0.0', this.config.model || 'claude-sonnet-4-5-20250929');

    // Start the main loop
    await this.mainLoop();
  }

  /**
   * Main interaction loop
   */
  private async mainLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get user input
        const event = await this.inputHandler.getInput();

        // Handle different event types
        switch (event.type) {
          case 'prompt':
            await this.handlePrompt(event.text);
            break;

          case 'command':
            await this.handleCommand(event.command);
            break;

          case 'interrupt':
            this.handleInterrupt(event.text);
            break;

          case 'exit':
            this.isRunning = false;
            break;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('readline was closed')) {
          this.isRunning = false;
        } else {
          this.renderer.showError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }

  /**
   * Handle a user prompt
   */
  private async handlePrompt(text: string): Promise<void> {
    this.state.isStreaming = true;
    this.state.turnCount++;

    // Enable interrupt capture during streaming
    this.inputHandler.enableCapture();

    // Create message handler
    const handler = createMessageHandler({
      renderer: this.renderer,
      onInit: (info) => {
        // Already shown by renderer
      },
      onResult: (stats) => {
        // Already shown by renderer
      },
    });

    // Create a message generator that yields from our queue
    const messageGenerator = this.createMessageGenerator();

    // Queue the initial message
    this.queueMessage(createUserMessage(text));

    try {
      // Stream the response
      for await (const message of this.agentBridge.stream(messageGenerator)) {
        handler.handle(message);

        // Check for pending interrupts
        const interrupt = this.inputHandler.getNextInterrupt();
        if (interrupt) {
          this.renderer.showInterrupt(interrupt);
          this.queueMessage(createUserMessage(`[User interrupt] ${interrupt}`));
        }
      }
    } catch (error) {
      handler.reset();
      this.renderer.showError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.state.isStreaming = false;
      this.inputHandler.disableCapture();

      // Signal end of conversation turn
      this.endMessageStream();
    }
  }

  /**
   * Create an async generator for messages
   */
  private async *createMessageGenerator(): AsyncGenerator<UserMessageInput, void, undefined> {
    while (this.isRunning) {
      const message = await this.getNextMessage();
      if (message === null) {
        return;
      }
      yield message;
    }
  }

  /**
   * Get the next message from the queue
   */
  private getNextMessage(): Promise<UserMessageInput | null> {
    // If there's a message in the queue, return it immediately
    if (this.messageQueue.length > 0) {
      return Promise.resolve(this.messageQueue.shift()!);
    }

    // Otherwise, wait for a message to be queued
    return new Promise((resolve) => {
      this.messageResolvers.push(resolve);
    });
  }

  /**
   * Queue a message for the generator
   */
  private queueMessage(message: UserMessageInput): void {
    // If there's a waiting resolver, resolve it immediately
    const resolver = this.messageResolvers.shift();
    if (resolver) {
      resolver(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Signal end of message stream
   */
  private endMessageStream(): void {
    // Resolve all pending resolvers with null
    for (const resolver of this.messageResolvers) {
      resolver(null);
    }
    this.messageResolvers = [];
    this.messageQueue = [];
  }

  /**
   * Handle an interrupt
   */
  private handleInterrupt(text: string): void {
    if (!this.state.isStreaming) return;

    this.state.pendingInterrupt = text;
    // The interrupt will be picked up in the main streaming loop
  }

  /**
   * Handle a command
   */
  private async handleCommand(command: string): Promise<void> {
    switch (command) {
      case 'help':
        this.renderer.showHelp();
        break;

      case 'clear':
        this.renderer.clear();
        this.renderer.showWelcome('1.0.0', this.config.model || 'claude-sonnet-4-5-20250929');
        break;

      case 'exit':
      case 'quit':
        this.isRunning = false;
        break;

      default:
        this.renderer.showWarning(`Unknown command: /${command}`);
        this.renderer.showInfo('Type /help for available commands');
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.isRunning = false;
    this.endMessageStream();
    this.inputHandler.close();
    this.renderer.stopSpinner();
  }
}

/**
 * Create a session instance
 */
export function createSession(config: Config): Session {
  return new Session(config);
}
