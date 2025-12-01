import { Marked } from 'marked';
import markedTerminal from 'marked-terminal';
import { highlight } from 'cli-highlight';
import { getPalette } from './colors.js';
/**
 * Create a markdown renderer for the terminal
 */
export function createMarkdownRenderer(colorScheme = 'default') {
    const palette = getPalette(colorScheme);
    const marked = new Marked();
    // Configure marked-terminal with our color scheme
    marked.use(markedTerminal({
        // Code blocks
        code: (code, lang) => {
            try {
                if (lang) {
                    return highlight(code, { language: lang, ignoreIllegals: true });
                }
                return highlight(code, { ignoreIllegals: true });
            }
            catch {
                return palette.dim(code);
            }
        },
        // Inline code
        codespan: (text) => palette.tool(text),
        // Block quotes
        blockquote: (text) => palette.dim(`│ ${text}`),
        // Headings
        heading: (text, level) => {
            const prefix = '#'.repeat(level);
            return `\n${palette.stats(`${prefix} ${text}`)}\n`;
        },
        // Emphasis
        strong: (text) => palette.assistant.bold(text),
        em: (text) => palette.assistant.italic(text),
        // Links
        link: (href, title, text) => {
            return `${palette.stats(text)} ${palette.dim(`(${href})`)}`;
        },
        // Lists
        listitem: (text) => `  • ${text}`,
        // Horizontal rules
        hr: () => palette.border('─'.repeat(40)),
        // Tables
        table: (header, body) => `${header}${body}`,
        tablerow: (content) => `${content}\n`,
        tablecell: (content) => `${content}\t`,
        // Paragraphs - just return the text
        paragraph: (text) => `${text}\n`,
        // HTML - strip it
        html: () => '',
        // Images - show alt text
        image: (_href, _title, text) => {
            return palette.dim(`[Image: ${text}]`);
        },
        // Width for word wrapping
        width: process.stdout.columns || 80,
        // Reflection (show links at the bottom)
        reflowText: true,
        // Tab size
        tab: 2,
        // Emoji support
        emoji: true,
    }));
    return marked;
}
/**
 * Render markdown to terminal string
 */
export function renderMarkdown(content, colorScheme = 'default') {
    const marked = createMarkdownRenderer(colorScheme);
    const rendered = marked.parse(content);
    // Handle both sync and async cases
    if (typeof rendered === 'string') {
        return rendered.trim();
    }
    // For simplicity, we'll use sync parsing
    // marked-terminal should be sync
    return String(rendered).trim();
}
/**
 * Render code block with syntax highlighting
 */
export function renderCodeBlock(code, language, colorScheme = 'default') {
    const palette = getPalette(colorScheme);
    try {
        if (language) {
            return highlight(code, { language, ignoreIllegals: true });
        }
        return highlight(code, { ignoreIllegals: true });
    }
    catch {
        return palette.dim(code);
    }
}
/**
 * Simple inline formatting without full markdown parsing
 * Useful for streaming where we want immediate output
 */
export function formatInline(text, colorScheme = 'default') {
    const palette = getPalette(colorScheme);
    return text
        // Inline code
        .replace(/`([^`]+)`/g, (_, code) => palette.tool(code))
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, (_, text) => palette.assistant.bold(text))
        // Italic
        .replace(/\*([^*]+)\*/g, (_, text) => palette.assistant.italic(text));
}
//# sourceMappingURL=markdown.js.map