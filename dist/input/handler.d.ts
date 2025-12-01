import type { InputEvent } from '../types.js';
/**
 * Input handler managing terminal input with interrupt support
 */
export declare class InputHandler {
    private rl;
    private colorScheme;
    private history;
    private maxHistory;
    private interruptQueue;
    private interruptCallback;
    private isCapturing;
    private captureBuffer;
    private pendingResolve;
    constructor(colorScheme?: 'default' | 'light' | 'minimal');
    /**
     * Set up raw mode handling for interrupt detection
     */
    private setupRawMode;
    /**
     * Handle a line of input
     */
    private handleLine;
    /**
     * Submit an interrupt
     */
    private submitInterrupt;
    /**
     * Show the prompt
     */
    private showPrompt;
    /**
     * Wait for user input (prompt or command)
     */
    getInput(): Promise<InputEvent>;
    /**
     * Enable capture mode for interrupts during streaming
     */
    enableCapture(): void;
    /**
     * Disable capture mode
     */
    disableCapture(): void;
    /**
     * Check if there are pending interrupts
     */
    hasPendingInterrupt(): boolean;
    /**
     * Get and clear the next interrupt
     */
    getNextInterrupt(): string | null;
    /**
     * Register interrupt callback
     */
    onInterrupt(callback: (text: string) => void): void;
    /**
     * Get input history
     */
    getHistory(): string[];
    /**
     * Close the input handler
     */
    close(): void;
    /**
     * Pause input (during output)
     */
    pause(): void;
    /**
     * Resume input
     */
    resume(): void;
}
/**
 * Create input handler instance
 */
export declare function createInputHandler(colorScheme?: 'default' | 'light' | 'minimal'): InputHandler;
//# sourceMappingURL=handler.d.ts.map