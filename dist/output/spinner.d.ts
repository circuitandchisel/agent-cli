/**
 * Spinner frame sets for different styles
 */
declare const SPINNERS: {
    readonly braille: {
        readonly frames: readonly ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        readonly interval: 80;
    };
    readonly dots: {
        readonly frames: readonly ["·", "•", "●", "•"];
        readonly interval: 200;
    };
    readonly minimal: {
        readonly frames: readonly ["-", "\\", "|", "/"];
        readonly interval: 100;
    };
    readonly quarters: {
        readonly frames: readonly ["◐", "◓", "◑", "◒"];
        readonly interval: 120;
    };
};
export type SpinnerStyle = keyof typeof SPINNERS;
/**
 * Animated spinner for terminal
 */
export declare class Spinner {
    private frameIndex;
    private intervalId;
    private message;
    private style;
    private colorScheme;
    constructor(message: string, style?: SpinnerStyle, colorScheme?: 'default' | 'light' | 'minimal');
    /**
     * Start the spinner animation
     */
    start(): this;
    /**
     * Update the spinner message
     */
    update(message: string): this;
    /**
     * Stop the spinner with a success message
     */
    success(message?: string): void;
    /**
     * Stop the spinner with a failure message
     */
    fail(message?: string): void;
    /**
     * Stop the spinner with an info message
     */
    info(message?: string): void;
    /**
     * Stop the spinner silently
     */
    stop(): void;
    /**
     * Check if spinner is currently running
     */
    isSpinning(): boolean;
}
/**
 * Create and start a spinner
 */
export declare function createSpinner(message: string, style?: SpinnerStyle, colorScheme?: 'default' | 'light' | 'minimal'): Spinner;
/**
 * Progress bar for known-length operations
 */
export declare class ProgressBar {
    private current;
    private total;
    private width;
    private message;
    private colorScheme;
    constructor(total: number, message?: string, width?: number, colorScheme?: 'default' | 'light' | 'minimal');
    /**
     * Update progress
     */
    update(current: number): void;
    /**
     * Increment progress by 1
     */
    increment(): void;
    /**
     * Render the progress bar
     */
    private render;
    /**
     * Complete the progress bar
     */
    complete(message?: string): void;
}
export {};
//# sourceMappingURL=spinner.d.ts.map