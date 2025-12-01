import { Spinner } from './spinner.js';
import type { ResultStats, UIConfig } from '../types.js';
/**
 * Main renderer for CLI output
 */
export declare class Renderer {
    private palette;
    private uiConfig;
    private currentSpinner;
    private streamBuffer;
    private isInCodeBlock;
    private codeBlockLang;
    private codeBlockContent;
    constructor(uiConfig: UIConfig);
    /**
     * Show welcome banner
     */
    showWelcome(version: string, model: string): void;
    /**
     * Show the prompt symbol
     */
    showPrompt(): void;
    /**
     * Echo user input
     */
    echoUser(text: string): void;
    /**
     * Start streaming assistant response
     */
    startStream(): void;
    /**
     * Stream a token from assistant response
     */
    streamToken(token: string): void;
    /**
     * Complete streaming response
     */
    completeStream(): void;
    /**
     * Show thinking indicator
     */
    showThinking(message?: string): Spinner;
    /**
     * Show tool execution
     */
    showToolStart(toolName: string, input?: Record<string, unknown>): Spinner;
    /**
     * Format brief description of tool input
     */
    private formatToolBrief;
    /**
     * Show tool completion
     */
    showToolComplete(toolName: string, success?: boolean): void;
    /**
     * Show tool output (abbreviated)
     */
    showToolOutput(output: string, maxLines?: number): void;
    /**
     * Show result statistics
     */
    showStats(stats: ResultStats): void;
    /**
     * Show error message
     */
    showError(error: Error | string): void;
    /**
     * Show warning message
     */
    showWarning(message: string): void;
    /**
     * Show info message
     */
    showInfo(message: string): void;
    /**
     * Show success message
     */
    showSuccess(message: string): void;
    /**
     * Show interrupt indicator
     */
    showInterrupt(message: string): void;
    /**
     * Show permission prompt for tool approval
     */
    showPermissionPrompt(toolName: string, input: Record<string, unknown>, reason?: string): void;
    /**
     * Show permission result
     */
    showPermissionResult(allowed: boolean, always?: boolean): void;
    /**
     * Show session initialized
     */
    showSessionInit(tools: string[], mcpServers: string[]): void;
    /**
     * Show help text
     */
    showHelp(): void;
    /**
     * Clear the screen
     */
    clear(): void;
    /**
     * Stop any active spinner
     */
    stopSpinner(): void;
}
/**
 * Create a renderer instance
 */
export declare function createRenderer(uiConfig: UIConfig): Renderer;
//# sourceMappingURL=renderer.d.ts.map