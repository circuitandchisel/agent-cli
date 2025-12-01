import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type { Renderer } from '../output/renderer.js';
import type { ResultStats } from '../types.js';

/**
 * Message type guards
 */
export function isSystemMessage(msg: SDKMessage): msg is SDKMessage & { type: 'system' } {
  return msg.type === 'system';
}

export function isAssistantMessage(msg: SDKMessage): msg is SDKMessage & { type: 'assistant' } {
  return msg.type === 'assistant';
}

export function isResultMessage(msg: SDKMessage): msg is SDKMessage & { type: 'result' } {
  return msg.type === 'result';
}

export function isUserMessage(msg: SDKMessage): msg is SDKMessage & { type: 'user' } {
  return msg.type === 'user';
}

export function isStreamEvent(msg: SDKMessage): msg is SDKMessage & { type: 'stream_event' } {
  return msg.type === 'stream_event';
}

/**
 * Extract text content from assistant message
 */
export function extractTextContent(message: SDKMessage): string {
  if (!isAssistantMessage(message)) return '';

  const msg = message as any;
  if (!msg.message?.content) return '';

  const content = msg.message.content;
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');
  }

  return '';
}

/**
 * Extract tool use from assistant message
 */
export function extractToolUse(message: SDKMessage): Array<{ name: string; input: any }> {
  if (!isAssistantMessage(message)) return [];

  const msg = message as any;
  if (!msg.message?.content) return [];

  const content = msg.message.content;
  if (!Array.isArray(content)) return [];

  return content
    .filter((block: any) => block.type === 'tool_use')
    .map((block: any) => ({
      name: block.name,
      input: block.input,
    }));
}

/**
 * Extract stats from result message
 */
export function extractResultStats(message: SDKMessage): ResultStats | null {
  if (!isResultMessage(message)) return null;

  const msg = message as any;

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
export function extractSystemInit(message: SDKMessage): {
  tools: string[];
  mcpServers: string[];
  model: string;
} | null {
  if (!isSystemMessage(message)) return null;

  const msg = message as any;
  if (msg.subtype !== 'init') return null;

  return {
    tools: msg.tools || [],
    mcpServers: Object.keys(msg.mcp_servers || {}),
    model: msg.model || 'unknown',
  };
}

/**
 * Handle streaming event for text deltas
 */
export function handleStreamEvent(
  message: SDKMessage,
  renderer: Renderer
): void {
  if (!isStreamEvent(message)) return;

  const msg = message as any;
  const event = msg.event;

  if (!event) return;

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
 * Message handler configuration
 */
export interface MessageHandlerConfig {
  renderer: Renderer;
  onToolStart?: (name: string, input: any) => void;
  onToolEnd?: (name: string) => void;
  onAssistantMessage?: (text: string) => void;
  onResult?: (stats: ResultStats) => void;
  onInit?: (info: { tools: string[]; mcpServers: string[]; model: string }) => void;
}

/**
 * Create a comprehensive message handler
 */
export function createMessageHandler(config: MessageHandlerConfig) {
  const { renderer, onToolStart, onToolEnd, onAssistantMessage, onResult, onInit } = config;

  let isStreaming = false;
  let currentTool: string | null = null;

  return {
    /**
     * Handle a single message from the SDK
     */
    handle(message: SDKMessage): void {
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
    reset(): void {
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
