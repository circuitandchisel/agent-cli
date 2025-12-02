#!/usr/bin/env node
import { loadConfig, hasApiKey, getConfigPath } from './config.js';
import { createSession } from './session.js';
import { getPalette, symbols } from './output/colors.js';
/**
 * Main entry point
 */
async function main() {
    const palette = getPalette('default');
    // Check for API key or gateway authentication
    if (!hasApiKey()) {
        console.error();
        console.error(`${palette.error(symbols.cross)} No authentication configured`);
        console.error();
        console.error('Please set one of the following:');
        console.error(palette.dim('  export ANTHROPIC_API_KEY="your-api-key"'));
        console.error(palette.dim('  export ANTHROPIC_AUTH_TOKEN="your-gateway-token"'));
        console.error(palette.dim('  export ANTHROPIC_BASE_URL="https://your-gateway"'));
        console.error();
        console.error('Get an API key from:');
        console.error(palette.stats('  https://console.anthropic.com/'));
        console.error();
        console.error('For LLM gateway setup, see:');
        console.error(palette.stats('  https://code.claude.com/docs/en/llm-gateway'));
        console.error();
        process.exit(1);
    }
    // Load configuration
    let config;
    try {
        config = await loadConfig();
        // Show config file location if found
        const configPath = getConfigPath();
        if (configPath) {
            // Config loaded from file - shown in welcome
        }
    }
    catch (error) {
        console.error();
        console.error(`${palette.error(symbols.cross)} Configuration error:`);
        console.error(palette.error(error instanceof Error ? error.message : String(error)));
        console.error();
        process.exit(1);
    }
    // Create and start session
    const session = createSession(config);
    // Handle graceful shutdown
    const cleanup = async () => {
        console.log();
        console.log(palette.dim('Shutting down...'));
        await session.cleanup();
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        console.error();
        console.error(`${palette.error(symbols.cross)} Uncaught exception:`);
        console.error(palette.error(error.message));
        if (error.stack) {
            console.error(palette.dim(error.stack));
        }
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        console.error();
        console.error(`${palette.error(symbols.cross)} Unhandled rejection:`);
        console.error(palette.error(reason instanceof Error ? reason.message : String(reason)));
        process.exit(1);
    });
    // Start the session
    try {
        await session.start();
    }
    catch (error) {
        console.error();
        console.error(`${palette.error(symbols.cross)} Fatal error:`);
        console.error(palette.error(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
// Run
main().catch((error) => {
    console.error('Failed to start:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map