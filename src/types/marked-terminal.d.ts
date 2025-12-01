declare module 'marked-terminal' {
  import type { MarkedExtension } from 'marked';

  interface MarkedTerminalOptions {
    code?: (code: string, lang?: string) => string;
    codespan?: (text: string) => string;
    blockquote?: (text: string) => string;
    heading?: (text: string, level: number) => string;
    strong?: (text: string) => string;
    em?: (text: string) => string;
    link?: (href: string, title: string | null, text: string) => string;
    listitem?: (text: string) => string;
    hr?: () => string;
    table?: (header: string, body: string) => string;
    tablerow?: (content: string) => string;
    tablecell?: (content: string) => string;
    paragraph?: (text: string) => string;
    html?: (html: string) => string;
    image?: (href: string, title: string | null, text: string) => string;
    width?: number;
    reflowText?: boolean;
    tab?: number;
    emoji?: boolean;
  }

  function markedTerminal(options?: MarkedTerminalOptions): MarkedExtension;
  export = markedTerminal;
}
