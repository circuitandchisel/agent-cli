import { type ChalkInstance } from 'chalk';
/**
 * Color palette for the CLI
 * Uses a restrained, professional palette
 */
export interface ColorPalette {
    user: ChalkInstance;
    assistant: ChalkInstance;
    thinking: ChalkInstance;
    tool: ChalkInstance;
    toolOutput: ChalkInstance;
    error: ChalkInstance;
    success: ChalkInstance;
    warning: ChalkInstance;
    stats: ChalkInstance;
    border: ChalkInstance;
    dim: ChalkInstance;
    prompt: ChalkInstance;
    promptSymbol: ChalkInstance;
}
/**
 * Default color scheme - dark terminal optimized
 */
export declare const defaultPalette: ColorPalette;
/**
 * Light terminal color scheme
 */
export declare const lightPalette: ColorPalette;
/**
 * Minimal color scheme - mostly monochrome
 */
export declare const minimalPalette: ColorPalette;
/**
 * Get color palette by scheme name
 */
export declare function getPalette(scheme: 'default' | 'light' | 'minimal'): ColorPalette;
/**
 * Box drawing characters
 */
export declare const box: {
    readonly topLeft: "╭";
    readonly topRight: "╮";
    readonly bottomLeft: "╰";
    readonly bottomRight: "╯";
    readonly horizontal: "─";
    readonly vertical: "│";
    readonly verticalRight: "├";
    readonly verticalLeft: "┤";
};
/**
 * Symbols used in the CLI
 */
export declare const symbols: {
    readonly prompt: "❯";
    readonly arrow: "→";
    readonly check: "✓";
    readonly cross: "✗";
    readonly warning: "⚠";
    readonly info: "ℹ";
    readonly bullet: "•";
    readonly ellipsis: "…";
};
//# sourceMappingURL=colors.d.ts.map