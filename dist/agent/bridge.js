import { query, } from '@anthropic-ai/claude-agent-sdk';
/**
 * Create a message generator that yields user messages
 */
export async function* createMessageGenerator(getNextMessage) {
    while (true) {
        const message = await getNextMessage();
        if (message === null) {
            return;
        }
        yield message;
    }
}
/**
 * Agent bridge - thin wrapper around SDK query
 */
export class AgentBridge {
    options;
    currentQuery = null;
    constructor(options) {
        this.options = options;
    }
    /**
     * Start a streaming query with a message generator
     */
    async *stream(messageGenerator) {
        // Cast to SDK type - the SDK will handle filling in session_id etc
        const q = query({
            prompt: messageGenerator,
            options: this.options,
        });
        this.currentQuery = q;
        try {
            for await (const message of q) {
                yield message;
            }
        }
        finally {
            this.currentQuery = null;
        }
    }
    /**
     * Run a single-turn query
     */
    async *singleTurn(prompt) {
        const q = query({
            prompt,
            options: {
                ...this.options,
                maxTurns: 1,
            },
        });
        this.currentQuery = q;
        try {
            for await (const message of q) {
                yield message;
            }
        }
        finally {
            this.currentQuery = null;
        }
    }
    /**
     * Interrupt the current query
     */
    interrupt() {
        if (this.currentQuery) {
            this.currentQuery.interrupt();
        }
    }
    /**
     * Check if a query is active
     */
    isActive() {
        return this.currentQuery !== null;
    }
    /**
     * Update options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
    /**
     * Get current options
     */
    getOptions() {
        return { ...this.options };
    }
}
/**
 * Create an agent bridge instance
 */
export function createAgentBridge(options) {
    return new AgentBridge(options);
}
/**
 * Create a user message
 */
export function createUserMessage(content) {
    return {
        type: 'user',
        message: {
            role: 'user',
            content,
        },
        parent_tool_use_id: null,
    };
}
/**
 * Create a user message with image
 */
export function createUserMessageWithImage(text, imageBase64, mediaType = 'image/png') {
    return {
        type: 'user',
        message: {
            role: 'user',
            content: [
                { type: 'text', text },
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: imageBase64,
                    },
                },
            ],
        },
        parent_tool_use_id: null,
    };
}
//# sourceMappingURL=bridge.js.map