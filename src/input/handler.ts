import * as readline from 'readline';
import type { InputEvent } from '../types.js';
import { getPalette, symbols } from '../output/colors.js';

/**
 * Input handler managing terminal input with interrupt support
 */
export class InputHandler {
  private rl: readline.Interface;
  private colorScheme: 'default' | 'light' | 'minimal';
  private history: string[] = [];
  private maxHistory: number = 100;

  // Interrupt handling
  private interruptQueue: string[] = [];
  private interruptCallback: ((text: string) => void) | null = null;
  private isCapturing: boolean = false;
  private captureBuffer: string = '';

  // Pending prompt resolver
  private pendingResolve: ((event: InputEvent) => void) | null = null;

  constructor(colorScheme: 'default' | 'light' | 'minimal' = 'default') {
    this.colorScheme = colorScheme;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      historySize: this.maxHistory,
      prompt: '',
    });

    // Handle line input
    this.rl.on('line', (line) => {
      this.handleLine(line);
    });

    // Handle close
    this.rl.on('close', () => {
      if (this.pendingResolve) {
        this.pendingResolve({ type: 'exit' });
        this.pendingResolve = null;
      }
    });

    // Set up raw mode for interrupt detection during streaming
    this.setupRawMode();
  }

  /**
   * Set up raw mode handling for interrupt detection
   */
  private setupRawMode(): void {
    if (!process.stdin.isTTY) return;

    process.stdin.on('keypress', (_str, key) => {
      // Ctrl+C
      if (key && key.ctrl && key.name === 'c') {
        if (this.isCapturing && this.captureBuffer) {
          // Submit captured text as interrupt
          this.submitInterrupt(this.captureBuffer);
          this.captureBuffer = '';
        } else {
          // Exit
          process.emit('SIGINT');
        }
      }
    });
  }

  /**
   * Handle a line of input
   */
  private handleLine(line: string): void {
    const trimmed = line.trim();

    // Add to history if non-empty
    if (trimmed) {
      this.history.push(trimmed);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    // Check for commands
    if (trimmed.startsWith('/')) {
      const command = trimmed.slice(1).toLowerCase();
      if (this.pendingResolve) {
        this.pendingResolve({ type: 'command', command });
        this.pendingResolve = null;
      }
      return;
    }

    // If we're in capture mode (streaming), treat as interrupt
    if (this.isCapturing && trimmed) {
      this.submitInterrupt(trimmed);
      return;
    }

    // Normal prompt resolution
    if (this.pendingResolve && trimmed) {
      this.pendingResolve({ type: 'prompt', text: trimmed });
      this.pendingResolve = null;
    } else if (this.pendingResolve && !trimmed) {
      // Empty line - show prompt again
      this.showPrompt();
    }
  }

  /**
   * Submit an interrupt
   */
  private submitInterrupt(text: string): void {
    this.interruptQueue.push(text);
    if (this.interruptCallback) {
      this.interruptCallback(text);
    }
  }

  /**
   * Show the prompt
   */
  private showPrompt(): void {
    const palette = getPalette(this.colorScheme);
    process.stdout.write(`${palette.promptSymbol(symbols.prompt)} `);
  }

  /**
   * Wait for user input (prompt or command)
   */
  async getInput(): Promise<InputEvent> {
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.showPrompt();
    });
  }

  /**
   * Enable capture mode for interrupts during streaming
   */
  enableCapture(): void {
    this.isCapturing = true;
    this.captureBuffer = '';
  }

  /**
   * Disable capture mode
   */
  disableCapture(): void {
    this.isCapturing = false;
    this.captureBuffer = '';
  }

  /**
   * Check if there are pending interrupts
   */
  hasPendingInterrupt(): boolean {
    return this.interruptQueue.length > 0;
  }

  /**
   * Get and clear the next interrupt
   */
  getNextInterrupt(): string | null {
    return this.interruptQueue.shift() || null;
  }

  /**
   * Register interrupt callback
   */
  onInterrupt(callback: (text: string) => void): void {
    this.interruptCallback = callback;
  }

  /**
   * Get input history
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Close the input handler
   */
  close(): void {
    this.rl.close();
  }

  /**
   * Pause input (during output)
   */
  pause(): void {
    this.rl.pause();
  }

  /**
   * Resume input
   */
  resume(): void {
    this.rl.resume();
  }
}

/**
 * Create input handler instance
 */
export function createInputHandler(
  colorScheme: 'default' | 'light' | 'minimal' = 'default'
): InputHandler {
  return new InputHandler(colorScheme);
}
