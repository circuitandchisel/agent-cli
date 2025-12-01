import { Marked } from 'marked';
import markedTerminal from 'marked-terminal';
import { highlight } from 'cli-highlight';
import { getPalette } from './colors.js';

/**
 * Create a markdown renderer for the terminal
 */
export function createMarkdownRenderer(colorScheme: 'default' | 'light' | 'minimal' = 'default') {
  const palette = getPalette(colorScheme);
  const marked = new Marked();

  // Configure marked-terminal with our color scheme
  marked.use(
    markedTerminal({
      // Code blocks
      code: (code: string, lang?: string) => {
        try {
          if (lang) {
            return highlight(code, { language: lang, ignoreIllegals: true });
          }
          return highlight(code, { ignoreIllegals: true });
        } catch {
          return palette.dim(code);
        }
      },

      // Inline code
      codespan: (text: string) => palette.tool(text),

      // Block quotes
      blockquote: (text: string) => palette.dim(`│ ${text}`),

      // Headings
      heading: (text: string, level: number) => {
        const prefix = '#'.repeat(level);
        return `\n${palette.stats(`${prefix} ${text}`)}\n`;
      },

      // Emphasis
      strong: (text: string) => palette.assistant.bold(text),
      em: (text: string) => palette.assistant.italic(text),

      // Links
      link: (href: string, title: string | null, text: string) => {
        return `${palette.stats(text)} ${palette.dim(`(${href})`)}`;
      },

      // Lists
      listitem: (text: string) => `  • ${text}`,

      // Horizontal rules
      hr: () => palette.border('─'.repeat(40)),

      // Tables
      table: (header: string, body: string) => `${header}${body}`,
      tablerow: (content: string) => `${content}\n`,
      tablecell: (content: string) => `${content}\t`,

      // Paragraphs - just return the text
      paragraph: (text: string) => `${text}\n`,

      // HTML - strip it
      html: () => '',

      // Images - show alt text
      image: (_href: string, _title: string | null, text: string) => {
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
    })
  );

  return marked;
}

/**
 * Render markdown to terminal string
 */
export function renderMarkdown(
  content: string,
  colorScheme: 'default' | 'light' | 'minimal' = 'default'
): string {
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
export function renderCodeBlock(
  code: string,
  language?: string,
  colorScheme: 'default' | 'light' | 'minimal' = 'default'
): string {
  const palette = getPalette(colorScheme);

  try {
    if (language) {
      return highlight(code, { language, ignoreIllegals: true });
    }
    return highlight(code, { ignoreIllegals: true });
  } catch {
    return palette.dim(code);
  }
}

/**
 * Simple inline formatting without full markdown parsing
 * Useful for streaming where we want immediate output
 */
export function formatInline(
  text: string,
  colorScheme: 'default' | 'light' | 'minimal' = 'default'
): string {
  const palette = getPalette(colorScheme);

  return text
    // Inline code
    .replace(/`([^`]+)`/g, (_, code) => palette.tool(code))
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, (_, text) => palette.assistant.bold(text))
    // Italic
    .replace(/\*([^*]+)\*/g, (_, text) => palette.assistant.italic(text));
}
