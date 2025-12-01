import { box, getPalette, symbols, type ColorPalette } from './colors.js';

/**
 * Format utilities for terminal output
 */

/**
 * Get terminal width, with fallback
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Wrap text to fit terminal width
 */
export function wrapText(text: string, maxWidth?: number): string {
  const width = maxWidth || getTerminalWidth() - 4;
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph.length <= width) {
      lines.push(paragraph);
      continue;
    }

    let line = '';
    for (const word of paragraph.split(' ')) {
      if (line.length + word.length + 1 <= width) {
        line += (line ? ' ' : '') + word;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Create a horizontal rule
 */
export function horizontalRule(
  palette: ColorPalette,
  width?: number,
  char: string = box.horizontal
): string {
  const w = width || getTerminalWidth();
  return palette.border(char.repeat(w));
}

/**
 * Create a boxed message
 */
export function boxedMessage(
  lines: string[],
  palette: ColorPalette,
  title?: string
): string {
  const width = getTerminalWidth() - 2;
  const innerWidth = width - 2;

  const result: string[] = [];

  // Top border with optional title
  if (title) {
    const titlePadded = ` ${title} `;
    const leftPad = Math.floor((innerWidth - titlePadded.length) / 2);
    const rightPad = innerWidth - leftPad - titlePadded.length;
    result.push(
      palette.border(box.topLeft) +
      palette.border(box.horizontal.repeat(leftPad)) +
      palette.stats(titlePadded) +
      palette.border(box.horizontal.repeat(rightPad)) +
      palette.border(box.topRight)
    );
  } else {
    result.push(
      palette.border(box.topLeft) +
      palette.border(box.horizontal.repeat(innerWidth)) +
      palette.border(box.topRight)
    );
  }

  // Content lines
  for (const line of lines) {
    const stripped = stripAnsi(line);
    const padding = innerWidth - stripped.length;
    result.push(
      palette.border(box.vertical) +
      ' ' + line + ' '.repeat(Math.max(0, padding - 1)) +
      palette.border(box.vertical)
    );
  }

  // Bottom border
  result.push(
    palette.border(box.bottomLeft) +
    palette.border(box.horizontal.repeat(innerWidth)) +
    palette.border(box.bottomRight)
  );

  return result.join('\n');
}

/**
 * Strip ANSI escape codes from string
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + symbols.ellipsis;
}

/**
 * Format duration in human readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Format token count
 */
export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  return `${(count / 1000).toFixed(1)}k`;
}

/**
 * Format cost in USD
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  return `$${usd.toFixed(4)}`;
}

/**
 * Format stats line
 */
export function formatStatsLine(
  palette: ColorPalette,
  durationMs: number,
  inputTokens: number,
  outputTokens: number,
  costUsd?: number
): string {
  const parts = [
    `⏱  ${formatDuration(durationMs)}`,
    `↑ ${formatTokens(inputTokens)}`,
    `↓ ${formatTokens(outputTokens)}`,
  ];

  if (costUsd !== undefined) {
    parts.push(formatCost(costUsd));
  }

  return palette.stats(parts.join('  │  '));
}

/**
 * Indent text
 */
export function indent(text: string, spaces: number = 2): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => pad + line)
    .join('\n');
}

/**
 * Create a tool call header
 */
export function toolHeader(
  palette: ColorPalette,
  toolName: string,
  brief?: string
): string {
  const header = `${palette.border(box.vertical)} ${palette.tool(`tool:${toolName}`)}`;
  const line = `${palette.border(box.vertical)} ${palette.border(box.horizontal.repeat(40))}`;

  if (brief) {
    return `${header} ${palette.dim(brief)}\n${line}`;
  }
  return `${header}\n${line}`;
}
