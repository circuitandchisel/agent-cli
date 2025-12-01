import chalk, { type ChalkInstance } from 'chalk';

/**
 * Color palette for the CLI
 * Uses a restrained, professional palette
 */
export interface ColorPalette {
  // Content colors
  user: ChalkInstance;
  assistant: ChalkInstance;
  thinking: ChalkInstance;

  // UI element colors
  tool: ChalkInstance;
  toolOutput: ChalkInstance;
  error: ChalkInstance;
  success: ChalkInstance;
  warning: ChalkInstance;

  // Meta colors
  stats: ChalkInstance;
  border: ChalkInstance;
  dim: ChalkInstance;

  // Prompt
  prompt: ChalkInstance;
  promptSymbol: ChalkInstance;
}

/**
 * Default color scheme - dark terminal optimized
 */
export const defaultPalette: ColorPalette = {
  user: chalk.hex('#87ceeb'),           // Soft cyan
  assistant: chalk.hex('#f5f5f5'),      // Warm white
  thinking: chalk.hex('#f9e2af'),       // Amber/gold

  tool: chalk.hex('#b48ead'),           // Muted purple
  toolOutput: chalk.hex('#6c7086'),     // Dim gray
  error: chalk.hex('#f38ba8'),          // Soft red
  success: chalk.hex('#a6e3a1'),        // Sage green
  warning: chalk.hex('#fab387'),        // Peach

  stats: chalk.hex('#89b4fa'),          // Slate blue
  border: chalk.hex('#45475a'),         // Charcoal
  dim: chalk.hex('#6c7086'),            // Dim gray

  prompt: chalk.hex('#87ceeb'),         // Soft cyan
  promptSymbol: chalk.hex('#87ceeb').bold,
};

/**
 * Light terminal color scheme
 */
export const lightPalette: ColorPalette = {
  user: chalk.hex('#0077b6'),           // Deep cyan
  assistant: chalk.hex('#1a1a2e'),      // Dark slate
  thinking: chalk.hex('#b8860b'),       // Dark goldenrod

  tool: chalk.hex('#7b2cbf'),           // Purple
  toolOutput: chalk.hex('#6c757d'),     // Gray
  error: chalk.hex('#dc3545'),          // Red
  success: chalk.hex('#198754'),        // Green
  warning: chalk.hex('#fd7e14'),        // Orange

  stats: chalk.hex('#0d6efd'),          // Blue
  border: chalk.hex('#dee2e6'),         // Light gray
  dim: chalk.hex('#adb5bd'),            // Muted gray

  prompt: chalk.hex('#0077b6'),
  promptSymbol: chalk.hex('#0077b6').bold,
};

/**
 * Minimal color scheme - mostly monochrome
 */
export const minimalPalette: ColorPalette = {
  user: chalk.white,
  assistant: chalk.white,
  thinking: chalk.gray,

  tool: chalk.gray,
  toolOutput: chalk.gray,
  error: chalk.red,
  success: chalk.green,
  warning: chalk.yellow,

  stats: chalk.gray,
  border: chalk.gray,
  dim: chalk.gray,

  prompt: chalk.white,
  promptSymbol: chalk.white.bold,
};

/**
 * Get color palette by scheme name
 */
export function getPalette(scheme: 'default' | 'light' | 'minimal'): ColorPalette {
  switch (scheme) {
    case 'light':
      return lightPalette;
    case 'minimal':
      return minimalPalette;
    default:
      return defaultPalette;
  }
}

/**
 * Box drawing characters
 */
export const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  verticalRight: '├',
  verticalLeft: '┤',
} as const;

/**
 * Symbols used in the CLI
 */
export const symbols = {
  prompt: '❯',
  arrow: '→',
  check: '✓',
  cross: '✗',
  warning: '⚠',
  info: 'ℹ',
  bullet: '•',
  ellipsis: '…',
} as const;
