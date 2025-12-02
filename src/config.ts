import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { type Config, DEFAULT_CONFIG, defineConfig } from './types.js';

/**
 * Config file names to search for
 */
const CONFIG_FILES = [
  'claude-agent.config.ts',
  'claude-agent.config.js',
  'claude-agent.config.mjs',
];

/**
 * Load configuration from file
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<Config> {
  for (const file of CONFIG_FILES) {
    const configPath = join(cwd, file);

    if (existsSync(configPath)) {
      try {
        // Import the config file
        const configUrl = pathToFileURL(configPath).href;
        const module = await import(configUrl);
        const userConfig = module.default;

        // Validate and merge with defaults
        return validateConfig(userConfig);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load config from ${file}: ${msg}`);
      }
    }
  }

  // No config file found - use defaults
  return DEFAULT_CONFIG;
}

/**
 * Validate and normalize config
 */
function validateConfig(config: unknown): Config {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  const userConfig = config as Partial<Config>;

  // Merge with defaults
  const merged: Config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    ui: {
      ...DEFAULT_CONFIG.ui,
      ...userConfig.ui,
    },
  };

  // Validate model
  if (merged.model && typeof merged.model !== 'string') {
    throw new Error('Config: model must be a string');
  }

  // Validate maxTurns
  if (merged.maxTurns !== undefined) {
    if (typeof merged.maxTurns !== 'number' || merged.maxTurns < 1) {
      throw new Error('Config: maxTurns must be a positive number');
    }
  }

  // Validate permissionMode
  const validModes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];
  if (merged.permissionMode && !validModes.includes(merged.permissionMode)) {
    throw new Error(`Config: permissionMode must be one of: ${validModes.join(', ')}`);
  }

  // Validate UI config
  const validSpinners = ['braille', 'dots', 'minimal'];
  if (!validSpinners.includes(merged.ui.spinnerStyle)) {
    throw new Error(`Config: ui.spinnerStyle must be one of: ${validSpinners.join(', ')}`);
  }

  const validSchemes = ['default', 'light', 'minimal'];
  if (!validSchemes.includes(merged.ui.colorScheme)) {
    throw new Error(`Config: ui.colorScheme must be one of: ${validSchemes.join(', ')}`);
  }

  return merged;
}

/**
 * Get config file path if it exists
 */
export function getConfigPath(cwd: string = process.cwd()): string | null {
  for (const file of CONFIG_FILES) {
    const configPath = join(cwd, file);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Check if ANTHROPIC_API_KEY is set
 */
export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Generate default config content
 */
export function generateDefaultConfig(): string {
  return `import { defineConfig } from './src/types.js';

export default defineConfig({
  // Model selection
  model: 'claude-opus-4-5-20251101',

  // Execution limits
  maxTurns: 50,

  // Tool permissions (optional - allows all by default)
  // allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],

  // Permission mode: 'default' | 'acceptEdits' | 'bypassPermissions'
  permissionMode: 'bypassPermissions',

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
`;
}

// Re-export defineConfig for user config files
export { defineConfig };
