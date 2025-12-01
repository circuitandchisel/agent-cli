import type { Config } from './types.js';
/**
 * Session manager - orchestrates the conversation lifecycle
 */
export declare class Session {
    private config;
    private renderer;
    private inputHandler;
    private agentBridge;
    private state;
    private messageQueue;
    private messageResolvers;
    private isRunning;
    constructor(config: Config);
    /**
     * Handle tool permission requests from the SDK
     */
    private handleCanUseTool;
    /**
     * Start the session
     */
    start(): Promise<void>;
    /**
     * Main interaction loop
     */
    private mainLoop;
    /**
     * Handle a user prompt
     */
    private handlePrompt;
    /**
     * Create an async generator for messages
     */
    private createMessageGenerator;
    /**
     * Get the next message from the queue
     */
    private getNextMessage;
    /**
     * Queue a message for the generator
     */
    private queueMessage;
    /**
     * Signal end of message stream
     */
    private endMessageStream;
    /**
     * Handle an interrupt
     */
    private handleInterrupt;
    /**
     * Handle a command
     */
    private handleCommand;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
/**
 * Create a session instance
 */
export declare function createSession(config: Config): Session;
//# sourceMappingURL=session.d.ts.map