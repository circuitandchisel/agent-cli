import * as readline from 'readline';
import { getPalette, symbols } from '../output/colors.js';
/**
 * Input handler managing terminal input with interrupt support
 */
export class InputHandler {
    rl;
    colorScheme;
    history = [];
    maxHistory = 100;
    // Interrupt handling
    interruptQueue = [];
    interruptCallback = null;
    isCapturing = false;
    captureBuffer = '';
    // Pending prompt resolver
    pendingResolve = null;
    // Permission prompt resolver
    pendingPermissionResolve = null;
    constructor(colorScheme = 'default') {
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
    setupRawMode() {
        if (!process.stdin.isTTY)
            return;
        process.stdin.on('keypress', (_str, key) => {
            // Ctrl+C
            if (key && key.ctrl && key.name === 'c') {
                if (this.isCapturing && this.captureBuffer) {
                    // Submit captured text as interrupt
                    this.submitInterrupt(this.captureBuffer);
                    this.captureBuffer = '';
                }
                else {
                    // Exit
                    process.emit('SIGINT');
                }
            }
        });
    }
    /**
     * Handle a line of input
     */
    handleLine(line) {
        const trimmed = line.trim();
        // Check if we're waiting for permission input
        if (this.pendingPermissionResolve) {
            const response = this.parsePermissionResponse(trimmed);
            if (response) {
                const resolve = this.pendingPermissionResolve;
                this.pendingPermissionResolve = null;
                resolve(response);
                return;
            }
            // Invalid response - prompt again
            process.stdout.write('  Please enter y/n/a: ');
            return;
        }
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
        }
        else if (this.pendingResolve && !trimmed) {
            // Empty line - show prompt again
            this.showPrompt();
        }
    }
    /**
     * Parse permission response from user input
     */
    parsePermissionResponse(input) {
        const normalized = input.toLowerCase().trim();
        if (normalized === 'y' || normalized === 'yes') {
            return 'yes';
        }
        if (normalized === 'n' || normalized === 'no') {
            return 'no';
        }
        if (normalized === 'a' || normalized === 'always' || normalized === 'always allow') {
            return 'always';
        }
        return null;
    }
    /**
     * Submit an interrupt
     */
    submitInterrupt(text) {
        this.interruptQueue.push(text);
        if (this.interruptCallback) {
            this.interruptCallback(text);
        }
    }
    /**
     * Show the prompt
     */
    showPrompt() {
        const palette = getPalette(this.colorScheme);
        process.stdout.write(`${palette.promptSymbol(symbols.prompt)} `);
    }
    /**
     * Wait for user input (prompt or command)
     */
    async getInput() {
        return new Promise((resolve) => {
            this.pendingResolve = resolve;
            this.showPrompt();
        });
    }
    /**
     * Wait for permission input (y/n/a)
     * This works even during streaming as it takes priority
     */
    async getPermissionInput() {
        return new Promise((resolve) => {
            this.pendingPermissionResolve = resolve;
            process.stdout.write('  > ');
        });
    }
    /**
     * Enable capture mode for interrupts during streaming
     */
    enableCapture() {
        this.isCapturing = true;
        this.captureBuffer = '';
    }
    /**
     * Disable capture mode
     */
    disableCapture() {
        this.isCapturing = false;
        this.captureBuffer = '';
    }
    /**
     * Check if there are pending interrupts
     */
    hasPendingInterrupt() {
        return this.interruptQueue.length > 0;
    }
    /**
     * Get and clear the next interrupt
     */
    getNextInterrupt() {
        return this.interruptQueue.shift() || null;
    }
    /**
     * Register interrupt callback
     */
    onInterrupt(callback) {
        this.interruptCallback = callback;
    }
    /**
     * Get input history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Close the input handler
     */
    close() {
        this.rl.close();
    }
    /**
     * Pause input (during output)
     */
    pause() {
        this.rl.pause();
    }
    /**
     * Resume input
     */
    resume() {
        this.rl.resume();
    }
}
/**
 * Create input handler instance
 */
export function createInputHandler(colorScheme = 'default') {
    return new InputHandler(colorScheme);
}
//# sourceMappingURL=handler.js.map