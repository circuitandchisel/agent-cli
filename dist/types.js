/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    model: 'claude-opus-4-5-20250514',
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
export function defineConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        ui: {
            ...DEFAULT_CONFIG.ui,
            ...config.ui,
        },
    };
}
//# sourceMappingURL=types.js.map