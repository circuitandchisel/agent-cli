import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type { Renderer } from '../output/renderer.js';
import type { ResultStats } from '../types.js';
/**
 * Message type guards
 */
export declare function isSystemMessage(msg: SDKMessage): msg is SDKMessage & {
    type: 'system';
};
export declare function isAssistantMessage(msg: SDKMessage): msg is SDKMessage & {
    type: 'assistant';
};
export declare function isResultMessage(msg: SDKMessage): msg is SDKMessage & {
    type: 'result';
};
export declare function isUserMessage(msg: SDKMessage): msg is SDKMessage & {
    type: 'user';
};
export declare function isStreamEvent(msg: SDKMessage): msg is SDKMessage & {
    type: 'stream_event';
};
/**
 * Extract text content from assistant message
 */
export declare function extractTextContent(message: SDKMessage): string;
/**
 * Extract tool use from assistant message
 */
export declare function extractToolUse(message: SDKMessage): Array<{
    name: string;
    input: any;
}>;
/**
 * Extract stats from result message
 */
export declare function extractResultStats(message: SDKMessage): ResultStats | null;
/**
 * Extract system init info
 */
export declare function extractSystemInit(message: SDKMessage): {
    tools: string[];
    mcpServers: string[];
    model: string;
} | null;
/**
 * Handle streaming event for text deltas
 */
export declare function handleStreamEvent(message: SDKMessage, renderer: Renderer): void;
/**
 * Message handler configuration
 */
export interface MessageHandlerConfig {
    renderer: Renderer;
    onToolStart?: (name: string, input: any) => void;
    onToolEnd?: (name: string) => void;
    onAssistantMessage?: (text: string) => void;
    onResult?: (stats: ResultStats) => void;
    onInit?: (info: {
        tools: string[];
        mcpServers: string[];
        model: string;
    }) => void;
}
/**
 * Create a comprehensive message handler
 */
export declare function createMessageHandler(config: MessageHandlerConfig): {
    /**
     * Handle a single message from the SDK
     */
    handle(message: SDKMessage): void;
    /**
     * Reset handler state
     */
    reset(): void;
};
//# sourceMappingURL=messages.d.ts.map