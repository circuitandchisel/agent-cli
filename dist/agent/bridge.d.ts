import { type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
/**
 * Simplified user message input type
 * The SDK will fill in session_id and other fields internally
 */
export interface UserMessageInput {
    type: 'user';
    message: {
        role: 'user';
        content: string | Array<{
            type: string;
            [key: string]: unknown;
        }>;
    };
    parent_tool_use_id?: string | null;
}
/**
 * Message generator type for streaming input
 */
export type MessageGenerator = AsyncGenerator<UserMessageInput, void, undefined>;
/**
 * Create a message generator that yields user messages
 */
export declare function createMessageGenerator(getNextMessage: () => Promise<UserMessageInput | null>): MessageGenerator;
/**
 * Agent bridge - thin wrapper around SDK query
 */
export declare class AgentBridge {
    private options;
    private currentQuery;
    constructor(options: Options);
    /**
     * Start a streaming query with a message generator
     */
    stream(messageGenerator: AsyncIterable<UserMessageInput>): AsyncIterable<SDKMessage>;
    /**
     * Run a single-turn query
     */
    singleTurn(prompt: string): AsyncIterable<SDKMessage>;
    /**
     * Interrupt the current query
     */
    interrupt(): void;
    /**
     * Check if a query is active
     */
    isActive(): boolean;
    /**
     * Update options
     */
    updateOptions(options: Partial<Options>): void;
    /**
     * Get current options
     */
    getOptions(): Options;
}
/**
 * Create an agent bridge instance
 */
export declare function createAgentBridge(options: Options): AgentBridge;
/**
 * Create a user message
 */
export declare function createUserMessage(content: string): UserMessageInput;
/**
 * Create a user message with image
 */
export declare function createUserMessageWithImage(text: string, imageBase64: string, mediaType?: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'): UserMessageInput;
//# sourceMappingURL=bridge.d.ts.map