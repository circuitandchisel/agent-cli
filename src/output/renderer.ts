import { getPalette, box, symbols, type ColorPalette } from './colors.js';
import { Spinner, createSpinner, type SpinnerStyle } from './spinner.js';
import {
  formatStatsLine,
  toolHeader,
  boxedMessage,
  horizontalRule,
  getTerminalWidth,
} from './format.js';
import { renderMarkdown, renderCodeBlock } from './markdown.js';
import type { ResultStats, UIConfig } from '../types.js';

/**
 * Main renderer for CLI output
 */
export class Renderer {
  private palette: ColorPalette;
  private uiConfig: UIConfig;
  private currentSpinner: Spinner | null = null;
  private streamBuffer: string = '';
  private isInCodeBlock: boolean = false;
  private codeBlockLang: string = '';
  private codeBlockContent: string = '';

  constructor(uiConfig: UIConfig) {
    this.palette = getPalette(uiConfig.colorScheme);
    this.uiConfig = uiConfig;
  }

  /**
   * Show welcome banner
   */
  showWelcome(version: string, model: string): void {
    const lines = [
      `Claude Agent CLI v${version}`,
      `Model: ${model}`,
      `Type /help for commands, Ctrl+C to exit`,
    ];
    console.log();
    console.log(boxedMessage(lines, this.palette));
    console.log();
  }

  /**
   * Show the prompt symbol
   */
  showPrompt(): void {
    process.stdout.write(`${this.palette.promptSymbol(symbols.prompt)} `);
  }

  /**
   * Echo user input
   */
  echoUser(text: string): void {
    // User input is already shown by readline, just add spacing
    console.log();
  }

  /**
   * Start streaming assistant response
   */
  startStream(): void {
    this.streamBuffer = '';
    this.isInCodeBlock = false;
    this.codeBlockLang = '';
    this.codeBlockContent = '';
  }

  /**
   * Stream a token from assistant response
   */
  streamToken(token: string): void {
    // Stop any spinner
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }

    this.streamBuffer += token;

    // Detect code block boundaries
    const lines = this.streamBuffer.split('\n');
    const lastLine = lines[lines.length - 1];

    // Check for code block start
    if (!this.isInCodeBlock && lastLine.startsWith('```')) {
      this.isInCodeBlock = true;
      this.codeBlockLang = lastLine.slice(3).trim();
      this.codeBlockContent = '';
      process.stdout.write(this.palette.border('```' + this.codeBlockLang) + '\n');
      return;
    }

    // Check for code block end
    if (this.isInCodeBlock && token.includes('```')) {
      this.isInCodeBlock = false;
      // Render accumulated code with highlighting
      const highlighted = renderCodeBlock(
        this.codeBlockContent.trim(),
        this.codeBlockLang || undefined,
        this.uiConfig.colorScheme
      );
      process.stdout.write(highlighted);
      process.stdout.write('\n' + this.palette.border('```') + '\n');
      this.codeBlockContent = '';
      this.codeBlockLang = '';
      return;
    }

    // Inside code block - accumulate
    if (this.isInCodeBlock) {
      this.codeBlockContent += token;
      return;
    }

    // Normal text - output directly
    process.stdout.write(this.palette.assistant(token));
  }

  /**
   * Complete streaming response
   */
  completeStream(): void {
    // Ensure we end on a new line
    if (this.streamBuffer && !this.streamBuffer.endsWith('\n')) {
      console.log();
    }
    console.log();
    this.streamBuffer = '';
  }

  /**
   * Show thinking indicator
   */
  showThinking(message: string = 'Thinking'): Spinner {
    this.currentSpinner = createSpinner(
      message,
      this.uiConfig.spinnerStyle as SpinnerStyle,
      this.uiConfig.colorScheme
    );
    return this.currentSpinner;
  }

  /**
   * Show tool execution
   */
  showToolStart(toolName: string, input?: Record<string, unknown>): Spinner {
    // Stop any existing spinner
    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }

    console.log();
    console.log(toolHeader(this.palette, toolName, this.formatToolBrief(toolName, input)));

    this.currentSpinner = createSpinner(
      `Running ${toolName}...`,
      'quarters',
      this.uiConfig.colorScheme
    );

    return this.currentSpinner;
  }

  /**
   * Format brief description of tool input
   */
  private formatToolBrief(toolName: string, input?: Record<string, unknown>): string {
    if (!input) return '';

    // Tool-specific briefs
    switch (toolName) {
      case 'Read':
        return input.file_path ? String(input.file_path) : '';
      case 'Write':
      case 'Edit':
        return input.file_path ? String(input.file_path) : '';
      case 'Bash':
        const cmd = String(input.command || '');
        return cmd.length > 40 ? cmd.slice(0, 40) + '...' : cmd;
      case 'Glob':
        return input.pattern ? String(input.pattern) : '';
      case 'Grep':
        return input.pattern ? String(input.pattern) : '';
      case 'WebFetch':
        return input.url ? String(input.url) : '';
      case 'WebSearch':
        return input.query ? String(input.query) : '';
      default:
        return '';
    }
  }

  /**
   * Show tool completion
   */
  showToolComplete(toolName: string, success: boolean = true): void {
    if (this.currentSpinner) {
      if (success) {
        this.currentSpinner.success(`${toolName} completed`);
      } else {
        this.currentSpinner.fail(`${toolName} failed`);
      }
      this.currentSpinner = null;
    }
  }

  /**
   * Show tool output (abbreviated)
   */
  showToolOutput(output: string, maxLines: number = 5): void {
    const lines = output.split('\n');
    const display = lines.slice(0, maxLines);

    for (const line of display) {
      console.log(`${this.palette.border(box.vertical)} ${this.palette.toolOutput(line)}`);
    }

    if (lines.length > maxLines) {
      console.log(
        `${this.palette.border(box.vertical)} ${this.palette.dim(`... ${lines.length - maxLines} more lines`)}`
      );
    }
    console.log();
  }

  /**
   * Show result statistics
   */
  showStats(stats: ResultStats): void {
    if (!this.uiConfig.showTiming && !this.uiConfig.showTokenCounts && !this.uiConfig.showCost) {
      return;
    }

    console.log(horizontalRule(this.palette, getTerminalWidth()));

    const parts: string[] = [];

    if (this.uiConfig.showTiming) {
      parts.push(`⏱  ${(stats.durationMs / 1000).toFixed(1)}s`);
    }

    if (this.uiConfig.showTokenCounts) {
      parts.push(`↑ ${stats.inputTokens.toLocaleString()}`);
      parts.push(`↓ ${stats.outputTokens.toLocaleString()}`);
    }

    if (this.uiConfig.showCost && stats.costUsd !== undefined) {
      parts.push(`$${stats.costUsd.toFixed(4)}`);
    }

    console.log(this.palette.stats(parts.join('  │  ')));
    console.log();
  }

  /**
   * Show error message
   */
  showError(error: Error | string): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }

    const message = error instanceof Error ? error.message : error;
    console.log();
    console.log(`${this.palette.error(symbols.cross)} ${this.palette.error('Error:')} ${message}`);

    if (error instanceof Error && error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 4);
      for (const line of stackLines) {
        console.log(this.palette.dim(line));
      }
    }
    console.log();
  }

  /**
   * Show warning message
   */
  showWarning(message: string): void {
    console.log(`${this.palette.warning(symbols.warning)} ${this.palette.warning(message)}`);
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    console.log(`${this.palette.stats(symbols.info)} ${message}`);
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    console.log(`${this.palette.success(symbols.check)} ${message}`);
  }

  /**
   * Show interrupt indicator
   */
  showInterrupt(message: string): void {
    console.log();
    console.log(
      `${this.palette.warning('⚡')} ${this.palette.warning('Interrupt:')} ${this.palette.user(message)}`
    );
    console.log();
  }

  /**
   * Show session initialized
   */
  showSessionInit(tools: string[], mcpServers: string[]): void {
    if (tools.length > 0) {
      const toolList = tools.slice(0, 5).join(', ');
      const more = tools.length > 5 ? ` +${tools.length - 5} more` : '';
      console.log(this.palette.dim(`Tools: ${toolList}${more}`));
    }

    if (mcpServers.length > 0) {
      console.log(this.palette.dim(`MCP Servers: ${mcpServers.join(', ')}`));
    }

    if (tools.length > 0 || mcpServers.length > 0) {
      console.log();
    }
  }

  /**
   * Show help text
   */
  showHelp(): void {
    const lines = [
      `${this.palette.stats('Commands:')}`,
      `  /help     Show this help message`,
      `  /clear    Clear conversation history`,
      `  /exit     Exit the CLI`,
      ``,
      `${this.palette.stats('Tips:')}`,
      `  • Type while Claude is responding to interrupt`,
      `  • Use Ctrl+C to exit at any time`,
      `  • Configuration is in claude-agent.config.ts`,
    ];

    console.log();
    for (const line of lines) {
      console.log(line);
    }
    console.log();
  }

  /**
   * Clear the screen
   */
  clear(): void {
    console.clear();
  }

  /**
   * Stop any active spinner
   */
  stopSpinner(): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }
}

/**
 * Create a renderer instance
 */
export function createRenderer(uiConfig: UIConfig): Renderer {
  return new Renderer(uiConfig);
}
