import { Marked } from 'marked';
/**
 * Create a markdown renderer for the terminal
 */
export declare function createMarkdownRenderer(colorScheme?: 'default' | 'light' | 'minimal'): Marked;
/**
 * Render markdown to terminal string
 */
export declare function renderMarkdown(content: string, colorScheme?: 'default' | 'light' | 'minimal'): string;
/**
 * Render code block with syntax highlighting
 */
export declare function renderCodeBlock(code: string, language?: string, colorScheme?: 'default' | 'light' | 'minimal'): string;
/**
 * Simple inline formatting without full markdown parsing
 * Useful for streaming where we want immediate output
 */
export declare function formatInline(text: string, colorScheme?: 'default' | 'light' | 'minimal'): string;
//# sourceMappingURL=markdown.d.ts.map