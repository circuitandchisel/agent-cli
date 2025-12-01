import { defineConfig } from './src/types.js';

export default defineConfig({
  // Model selection
  model: 'claude-sonnet-4-5-20250929',

  // Execution limits
  maxTurns: 50,

  // Tool permissions (optional - allows all by default)
  // allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],

  // Permission mode: 'default' | 'acceptEdits' | 'bypassPermissions'
  permissionMode: 'default',

  // Working directory (defaults to cwd)
  cwd: process.cwd(),

  // UI preferences
  ui: {
    showTokenCounts: true,
    showCost: true,
    showTiming: true,
    spinnerStyle: 'braille', // 'braille' | 'dots' | 'minimal'
    colorScheme: 'default',  // 'default' | 'light' | 'minimal'
  },
});
