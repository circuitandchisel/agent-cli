import { type Config, defineConfig } from './types.js';
/**
 * Load configuration from file
 */
export declare function loadConfig(cwd?: string): Promise<Config>;
/**
 * Get config file path if it exists
 */
export declare function getConfigPath(cwd?: string): string | null;
/**
 * Check if ANTHROPIC_API_KEY is set
 */
export declare function hasApiKey(): boolean;
/**
 * Generate default config content
 */
export declare function generateDefaultConfig(): string;
export { defineConfig };
//# sourceMappingURL=config.d.ts.map