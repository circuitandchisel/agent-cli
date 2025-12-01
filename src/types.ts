import type { Options as SDKOptions } from '@anthropic-ai/claude-agent-sdk';

/**
 * UI configuration options
 */
export interface UIConfig {
  showTokenCounts: boolean;
  showCost: boolean;
  showTiming: boolean;
  spinnerStyle: 'braille' | 'dots' | 'minimal';
  colorScheme: 'default' | 'light' | 'minimal';
}

/**
 * Full CLI configuration
 */
export interface Config extends Omit<SDKOptions, 'abortController'> {
  ui: UIConfig;
}

/**
 * User input event types
 */
export type InputEvent =
  | { type: 'prompt'; text: string }
  | { type: 'interrupt'; text: string }
  | { type: 'command'; command: string }
  | { type: 'exit' };

/**
 * Session state
 */
export interface SessionState {
  isStreaming: boolean;
  pendingInterrupt: string | null;
  turnCount: number;
}

/**
 * Result statistics from SDK
 */
export interface ResultStats {
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  model: 'claude-sonnet-4-5-20250929',
  maxTurns: 50,
  permissionMode: 'default',
  ui: {
    showTokenCounts: true,
    showCost: true,
    showTiming: true,
    spinnerStyle: 'braille',
    colorScheme: 'default',
  },
};

/**
 * Helper to create config with defaults
 */
export function defineConfig(config: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    ui: {
      ...DEFAULT_CONFIG.ui,
      ...config.ui,
    },
  };
}
