/**
 * Message type guards
 */
export function isSystemMessage(msg) {
    return msg.type === 'system';
}
export function isAssistantMessage(msg) {
    return msg.type === 'assistant';
}
export function isResultMessage(msg) {
    return msg.type === 'result';
}
export function isUserMessage(msg) {
    return msg.type === 'user';
}
export function isStreamEvent(msg) {
    return msg.type === 'stream_event';
}
/**
 * Extract text content from assistant message
 */
export function extractTextContent(message) {
    if (!isAssistantMessage(message))
        return '';
    const msg = message;
    if (!msg.message?.content)
        return '';
    const content = msg.message.content;
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content)) {
        return content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('');
    }
    return '';
}
/**
 * Extract tool use from assistant message
 */
export function extractToolUse(message) {
    if (!isAssistantMessage(message))
        return [];
    const msg = message;
    if (!msg.message?.content)
        return [];
    const content = msg.message.content;
    if (!Array.isArray(content))
        return [];
    return content
        .filter((block) => block.type === 'tool_use')
        .map((block) => ({
        name: block.name,
        input: block.input,
    }));
}
/**
 * Extract stats from result message
 */
export function extractResultStats(message) {
    if (!isResultMessage(message))
        return null;
    const msg = message;
    return {
        durationMs: msg.duration_ms || 0,
        inputTokens: msg.usage?.input_tokens || 0,
        outputTokens: msg.usage?.output_tokens || 0,
        costUsd: msg.total_cost_usd,
    };
}
/**
 * Extract system init info
 */
export function extractSystemInit(message) {
    if (!isSystemMessage(message))
        return null;
    const msg = message;
    if (msg.subtype !== 'init')
        return null;
    return {
        tools: msg.tools || [],
        mcpServers: Object.keys(msg.mcp_servers || {}),
        model: msg.model || 'unknown',
    };
}
/**
 * Handle streaming event for text deltas
 */
export function handleStreamEvent(message, renderer) {
    if (!isStreamEvent(message))
        return;
    const msg = message;
    const event = msg.event;
    if (!event)
        return;
    // Handle content block delta (streaming text)
    if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (delta?.type === 'text_delta' && delta.text) {
            renderer.streamToken(delta.text);
        }
    }
    // Handle content block start (for tool use indication)
    if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block?.type === 'tool_use') {
            renderer.showToolStart(block.name, block.input);
        }
    }
}
/**
 * Create a comprehensive message handler
 */
export function createMessageHandler(config) {
    const { renderer, onToolStart, onToolEnd, onAssistantMessage, onResult, onInit } = config;
    let isStreaming = false;
    let currentTool = null;
    return {
        /**
         * Handle a single message from the SDK
         */
        handle(message) {
            // System init message
            if (isSystemMessage(message)) {
                const initInfo = extractSystemInit(message);
                if (initInfo) {
                    renderer.showSessionInit(initInfo.tools, initInfo.mcpServers);
                    onInit?.(initInfo);
                }
                return;
            }
            // Stream events (partial content)
            if (isStreamEvent(message)) {
                if (!isStreaming) {
                    renderer.startStream();
                    isStreaming = true;
                }
                handleStreamEvent(message, renderer);
                return;
            }
            // Complete assistant message
            if (isAssistantMessage(message)) {
                // Complete any streaming
                if (isStreaming) {
                    renderer.completeStream();
                    isStreaming = false;
                }
                // Handle tool use
                const tools = extractToolUse(message);
                for (const tool of tools) {
                    currentTool = tool.name;
                    renderer.showToolStart(tool.name, tool.input);
                    onToolStart?.(tool.name, tool.input);
                }
                // Handle text content
                const text = extractTextContent(message);
                if (text && !isStreaming) {
                    // If we weren't streaming, show the full text now
                    onAssistantMessage?.(text);
                }
                return;
            }
            // Result message
            if (isResultMessage(message)) {
                // Complete any streaming
                if (isStreaming) {
                    renderer.completeStream();
                    isStreaming = false;
                }
                // Complete any tool
                if (currentTool) {
                    renderer.showToolComplete(currentTool, true);
                    onToolEnd?.(currentTool);
                    currentTool = null;
                }
                // Show stats
                const stats = extractResultStats(message);
                if (stats) {
                    renderer.showStats(stats);
                    onResult?.(stats);
                }
                return;
            }
            // User message echo (usually handled by input)
            if (isUserMessage(message)) {
                return;
            }
        },
        /**
         * Reset handler state
         */
        reset() {
            if (isStreaming) {
                renderer.completeStream();
                isStreaming = false;
            }
            if (currentTool) {
                renderer.showToolComplete(currentTool, false);
                currentTool = null;
            }
        },
    };
}
//# sourceMappingURL=messages.js.map