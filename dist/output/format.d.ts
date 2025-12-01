import { type ColorPalette } from './colors.js';
/**
 * Format utilities for terminal output
 */
/**
 * Get terminal width, with fallback
 */
export declare function getTerminalWidth(): number;
/**
 * Wrap text to fit terminal width
 */
export declare function wrapText(text: string, maxWidth?: number): string;
/**
 * Create a horizontal rule
 */
export declare function horizontalRule(palette: ColorPalette, width?: number, char?: string): string;
/**
 * Create a boxed message
 */
export declare function boxedMessage(lines: string[], palette: ColorPalette, title?: string): string;
/**
 * Strip ANSI escape codes from string
 */
export declare function stripAnsi(str: string): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncate(str: string, maxLength: number): string;
/**
 * Format duration in human readable form
 */
export declare function formatDuration(ms: number): string;
/**
 * Format token count
 */
export declare function formatTokens(count: number): string;
/**
 * Format cost in USD
 */
export declare function formatCost(usd: number): string;
/**
 * Format stats line
 */
export declare function formatStatsLine(palette: ColorPalette, durationMs: number, inputTokens: number, outputTokens: number, costUsd?: number): string;
/**
 * Indent text
 */
export declare function indent(text: string, spaces?: number): string;
/**
 * Create a tool call header
 */
export declare function toolHeader(palette: ColorPalette, toolName: string, brief?: string): string;
//# sourceMappingURL=format.d.ts.map