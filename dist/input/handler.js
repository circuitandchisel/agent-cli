import * as readline from 'readline';
import { getPalette, symbols } from '../output/colors.js';
/**
 * Input handler managing terminal input with interrupt support
 * Supports multiline input via:
 * - Option+Enter (Alt+Enter) to add a new line
 * - Backslash continuation (end line with \)
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
    // Multiline input handling
    multilineBuffer = [];
    isMultilineMode = false;
    skipNextLine = false;
    // Pending prompt resolver
    pendingResolve = null;
    // Permission prompt resolver
    pendingPermissionResolve = null;
    // Exit confirmation - require Ctrl+C twice within timeout to exit
    lastCtrlCTime = 0;
    ctrlCTimeoutMs = 2000; // 2 seconds to press Ctrl+C again
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
     * Set up raw mode handling for interrupt detection and Option+Enter
     */
    setupRawMode() {
        if (!process.stdin.isTTY)
            return;
        process.stdin.on('keypress', (_str, key) => {
            // Option+Enter (Alt+Enter) for multiline input
            // On macOS, Option+Enter sends ESC + CR which sets key.meta = true
            if (key && key.meta && (key.name === 'return' || key.name === 'enter')) {
                // Get current line content from readline
                const currentLine = this.rl.line || '';
                // Add to multiline buffer
                this.multilineBuffer.push(currentLine);
                this.isMultilineMode = true;
                this.skipNextLine = true;
                // Clear the current line display and show continuation
                process.stdout.write('\n');
                this.showContinuationPrompt();
                // Clear readline's internal line buffer
                this.rl.line = '';
                this.rl.cursor = 0;
                return;
            }
            // Ctrl+C
            if (key && key.ctrl && key.name === 'c') {
                // Cancel multiline mode if active
                if (this.isMultilineMode) {
                    this.multilineBuffer = [];
                    this.isMultilineMode = false;
                    this.skipNextLine = false;
                    console.log(); // New line
                    this.showPrompt();
                    return;
                }
                if (this.isCapturing && this.captureBuffer) {
                    // Submit captured text as interrupt
                    this.submitInterrupt(this.captureBuffer);
                    this.captureBuffer = '';
                }
                else {
                    // Require Ctrl+C twice within timeout to exit
                    const now = Date.now();
                    const palette = getPalette(this.colorScheme);
                    if (now - this.lastCtrlCTime < this.ctrlCTimeoutMs) {
                        // Second Ctrl+C within timeout - exit
                        process.emit('SIGINT');
                    }
                    else {
                        // First Ctrl+C - show warning and wait for second
                        this.lastCtrlCTime = now;
                        console.log();
                        console.log(palette.warning('Press Ctrl+C again to exit'));
                        this.showPrompt();
                    }
                }
            }
        });
    }
    /**
     * Handle a line of input
     */
    handleLine(line) {
        // Skip this line event if it was triggered by Option+Enter
        // (we already handled it in the keypress handler)
        if (this.skipNextLine) {
            this.skipNextLine = false;
            return;
        }
        // Check if we're waiting for permission input
        if (this.pendingPermissionResolve) {
            const response = this.parsePermissionResponse(line.trim());
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
        // Check for backslash continuation (multiline mode)
        if (line.endsWith('\\')) {
            // Remove the trailing backslash and add to buffer
            const lineWithoutBackslash = line.slice(0, -1);
            this.multilineBuffer.push(lineWithoutBackslash);
            this.isMultilineMode = true;
            this.showContinuationPrompt();
            return;
        }
        // If we're in multiline mode, add this line and check if we should submit
        if (this.isMultilineMode) {
            this.multilineBuffer.push(line);
            // Join all lines and submit
            const fullText = this.multilineBuffer.join('\n');
            this.multilineBuffer = [];
            this.isMultilineMode = false;
            this.processInput(fullText);
            return;
        }
        // Normal single-line input
        this.processInput(line);
    }
    /**
     * Process completed input (single or multiline)
     */
    processInput(text) {
        const trimmed = text.trim();
        // Add to history if non-empty
        if (trimmed) {
            this.history.push(trimmed);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }
        // Check for commands (only if single line starting with /)
        if (trimmed.startsWith('/') && !trimmed.includes('\n')) {
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
     * Show the continuation prompt for multiline input
     */
    showContinuationPrompt() {
        const palette = getPalette(this.colorScheme);
        process.stdout.write(`${palette.dim('...')} `);
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