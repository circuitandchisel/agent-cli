import {
  query,
  type Options,
  type SDKMessage,
  type SDKUserMessage,
  type Query,
} from '@anthropic-ai/claude-agent-sdk';

/**
 * Simplified user message input type
 * The SDK will fill in session_id and other fields internally
 */
export interface UserMessageInput {
  type: 'user';
  message: {
    role: 'user';
    content: string | Array<{ type: string; [key: string]: unknown }>;
  };
  parent_tool_use_id?: string | null;
}

/**
 * Message generator type for streaming input
 */
export type MessageGenerator = AsyncGenerator<UserMessageInput, void, undefined>;

/**
 * Create a message generator that yields user messages
 */
export async function* createMessageGenerator(
  getNextMessage: () => Promise<UserMessageInput | null>
): MessageGenerator {
  while (true) {
    const message = await getNextMessage();
    if (message === null) {
      return;
    }
    yield message;
  }
}

/**
 * Agent bridge - thin wrapper around SDK query
 */
export class AgentBridge {
  private options: Options;
  private currentQuery: Query | null = null;

  constructor(options: Options) {
    this.options = options;
  }

  /**
   * Start a streaming query with a message generator
   */
  async *stream(
    messageGenerator: AsyncIterable<UserMessageInput>
  ): AsyncIterable<SDKMessage> {
    // Cast to SDK type - the SDK will handle filling in session_id etc
    const q = query({
      prompt: messageGenerator as AsyncIterable<SDKUserMessage>,
      options: this.options,
    });

    this.currentQuery = q;

    try {
      for await (const message of q) {
        yield message;
      }
    } finally {
      this.currentQuery = null;
    }
  }

  /**
   * Run a single-turn query
   */
  async *singleTurn(prompt: string): AsyncIterable<SDKMessage> {
    const q = query({
      prompt,
      options: {
        ...this.options,
        maxTurns: 1,
      },
    });

    this.currentQuery = q;

    try {
      for await (const message of q) {
        yield message;
      }
    } finally {
      this.currentQuery = null;
    }
  }

  /**
   * Interrupt the current query
   */
  interrupt(): void {
    if (this.currentQuery) {
      this.currentQuery.interrupt();
    }
  }

  /**
   * Check if a query is active
   */
  isActive(): boolean {
    return this.currentQuery !== null;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<Options>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Options {
    return { ...this.options };
  }
}

/**
 * Create an agent bridge instance
 */
export function createAgentBridge(options: Options): AgentBridge {
  return new AgentBridge(options);
}

/**
 * Create a user message
 */
export function createUserMessage(content: string): UserMessageInput {
  return {
    type: 'user',
    message: {
      role: 'user',
      content,
    },
    parent_tool_use_id: null,
  };
}

/**
 * Create a user message with image
 */
export function createUserMessageWithImage(
  text: string,
  imageBase64: string,
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
): UserMessageInput {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [
        { type: 'text', text },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: imageBase64,
          },
        },
      ],
    },
    parent_tool_use_id: null,
  };
}
