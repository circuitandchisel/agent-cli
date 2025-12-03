import type { InputEvent } from '../types.js';
/**
 * Input handler managing terminal input with interrupt support
 * Supports multiline input via:
 * - Option+Enter (Alt+Enter) to add a new line
 * - Backslash continuation (end line with \)
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
    private multilineBuffer;
    private isMultilineMode;
    private skipNextLine;
    private pendingResolve;
    private pendingPermissionResolve;
    private lastCtrlCTime;
    private readonly ctrlCTimeoutMs;
    constructor(colorScheme?: 'default' | 'light' | 'minimal');
    /**
     * Set up raw mode handling for interrupt detection and Option+Enter
     */
    private setupRawMode;
    /**
     * Handle a line of input
     */
    private handleLine;
    /**
     * Process completed input (single or multiline)
     */
    private processInput;
    /**
     * Parse permission response from user input
     */
    private parsePermissionResponse;
    /**
     * Submit an interrupt
     */
    private submitInterrupt;
    /**
     * Show the prompt
     */
    private showPrompt;
    /**
     * Show the continuation prompt for multiline input
     */
    private showContinuationPrompt;
    /**
     * Wait for user input (prompt or command)
     */
    getInput(): Promise<InputEvent>;
    /**
     * Wait for permission input (y/n/a)
     * This works even during streaming as it takes priority
     */
    getPermissionInput(): Promise<'yes' | 'no' | 'always'>;
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