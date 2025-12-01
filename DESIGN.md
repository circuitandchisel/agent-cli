# Claude Agent CLI - Design Document

A polished, interactive command-line interface wrapper for the Claude Agent SDK with rich visual feedback, streaming support, and seamless interrupt capabilities.

## Overview

This CLI provides a refined terminal experience for interacting with Claude agents, featuring:

- **Streaming-first architecture**: Real-time response rendering as tokens arrive
- **Visual polish**: Tasteful color palette, animated spinners, and progress indicators
- **Interrupt capability**: Users can inject additional context mid-response
- **Static configuration**: All settings loaded from config files, zero runtime flags

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Entry                               │
│                         (src/index.ts)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      Session Manager                             │
│                    (src/session.ts)                             │
│  • Manages conversation lifecycle                                │
│  • Coordinates input/output streams                              │
│  • Handles interrupt signals                                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│  Input Layer  │ │  SDK Bridge   │ │ Output Layer  │
│ (src/input/)  │ │ (src/agent/)  │ │ (src/output/) │
│               │ │               │ │               │
│ • Readline    │ │ • query()     │ │ • Renderer    │
│ • Interrupt   │ │ • Streaming   │ │ • Spinner     │
│ • History     │ │ • Messages    │ │ • Colors      │
└───────────────┘ └───────────────┘ └───────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Config Loader                                 │
│                   (src/config.ts)                               │
│  • Loads claude-agent.config.ts                                  │
│  • Validates configuration schema                                │
│  • Provides typed options to SDK                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Entry Point (`src/index.ts`)

Minimal bootstrapping:
1. Load configuration from `claude-agent.config.ts`
2. Initialize terminal UI
3. Start session manager
4. Handle graceful shutdown

### 2. Session Manager (`src/session.ts`)

The orchestration layer managing the conversation lifecycle:

```typescript
interface SessionState {
  isStreaming: boolean;
  pendingInterrupt: string | null;
  messageHistory: SDKMessage[];
  currentQuery: Query | null;
}
```

**Responsibilities:**
- Spawn SDK `query()` with async generator for streaming input
- Route incoming messages to appropriate handlers
- Coordinate interrupt injection via generator yield
- Manage conversation context persistence

### 3. Agent Bridge (`src/agent/bridge.ts`)

Thin wrapper around `@anthropic-ai/claude-agent-sdk`:

```typescript
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';

export async function* createAgentStream(
  messageGenerator: AsyncIterable<SDKUserMessage>,
  options: Options
): AsyncIterable<SDKMessage> {
  const q = query({ prompt: messageGenerator, options });
  for await (const message of q) {
    yield message;
  }
}
```

**Message Type Handling:**

| Message Type | UI Response |
|-------------|-------------|
| `SDKSystemMessage` | Display session init info |
| `SDKAssistantMessage` | Render streamed content |
| `SDKPartialAssistantMessage` | Update streaming text |
| `SDKResultMessage` | Show completion stats |
| `SDKUserMessage` | Echo user input |

### 4. Input Handler (`src/input/handler.ts`)

Manages terminal input with interrupt awareness:

```typescript
interface InputHandler {
  prompt(): Promise<string>;
  interrupt(message: string): void;
  onInterrupt(callback: (msg: string) => void): void;
}
```

**Key behaviors:**
- Normal mode: Blocking readline for user prompts
- Streaming mode: Non-blocking capture for interrupts
- History: Up/down arrow navigation through past inputs

**Interrupt flow:**
1. User types while Claude is streaming
2. Input captured and queued as interrupt
3. Interrupt yielded to SDK message generator
4. Claude processes interrupt alongside current context

### 5. Output Renderer (`src/output/renderer.ts`)

Rich terminal output with visual polish:

```typescript
interface Renderer {
  streamToken(token: string): void;
  completeStream(): void;
  showSpinner(message: string): Spinner;
  showToolCall(tool: string, input: unknown): void;
  showError(error: Error): void;
  showStats(stats: ResultStats): void;
}
```

---

## Visual Design

### Color Palette

A restrained, professional palette using ANSI 256 colors:

```
┌──────────────────────────────────────────────────────────┐
│  Role          │  Color                │  ANSI Code     │
├──────────────────────────────────────────────────────────┤
│  User input    │  Soft cyan            │  #87ceeb (117) │
│  Claude text   │  Warm white           │  #f5f5f5 (255) │
│  Tool names    │  Muted purple         │  #b48ead (139) │
│  Tool output   │  Dim gray             │  #6c7086 (243) │
│  Thinking      │  Amber/gold           │  #f9e2af (222) │
│  Errors        │  Soft red             │  #f38ba8 (210) │
│  Success       │  Sage green           │  #a6e3a1 (150) │
│  Stats/meta    │  Slate blue           │  #89b4fa (111) │
│  Borders       │  Charcoal             │  #45475a (240) │
└──────────────────────────────────────────────────────────┘
```

### Typography & Spacing

- **User prompt prefix**: `❯` in cyan
- **Claude response**: No prefix, clean left margin
- **Tool calls**: Indented with `│` border
- **Blank lines**: Single line between turns
- **Width**: Respect terminal width, soft-wrap at boundaries

### Animations

**Spinner states:**

```
Thinking     ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏  (Braille dots, 80ms)
Tool running ◐ ◓ ◑ ◒              (Quarter circles, 120ms)
Waiting      · • ● •              (Pulsing dot, 200ms)
```

**Streaming effect:**
- Tokens appear character-by-character with 0ms artificial delay (natural SDK timing)
- Cursor blinks at end of stream
- Smooth scroll for long outputs

### Example Session

```
╭─────────────────────────────────────────────╮
│  Claude Agent CLI v1.0.0                    │
│  Model: claude-sonnet-4-5-20250929          │
│  Type /help for commands, Ctrl+C to exit   │
╰─────────────────────────────────────────────╯

❯ Explain how async generators work in TypeScript

Async generators combine two powerful TypeScript features:
generators and async/await.

An async generator function is declared with `async function*`
and can both `yield` values and `await` promises:

│ tool:Read src/example.ts
│ ────────────────────────
│ Reading file contents...

```typescript
async function* fetchPages(urls: string[]) {
  for (const url of urls) {
    const response = await fetch(url);
    yield await response.text();
  }
}
```

The consumer iterates with `for await...of`:

```typescript
for await (const page of fetchPages(urls)) {
  console.log(page);
}
```

──────────────────────────────────────────────
⏱  3.2s  │  ↑ 1,247 tokens  │  ↓ 892 tokens  │  $0.0034
```

---

## Interrupt System

### Design Goals

1. **Non-disruptive**: User can type while Claude streams
2. **Contextual**: Interrupt content joins ongoing conversation
3. **Visual feedback**: Clear indication of queued interrupt

### Implementation

```typescript
// Message generator with interrupt support
async function* messageGenerator(
  inputHandler: InputHandler
): AsyncIterable<SDKUserMessage> {
  while (true) {
    // Wait for explicit user input OR interrupt
    const input = await inputHandler.getNextInput();

    if (input.type === 'prompt') {
      yield {
        type: 'user',
        message: { role: 'user', content: input.text }
      };
    } else if (input.type === 'interrupt') {
      yield {
        type: 'user',
        message: {
          role: 'user',
          content: `[INTERRUPT] ${input.text}`
        }
      };
    }
  }
}
```

### UX Flow

```
❯ Write a function to parse CSV files

Sure, I'll create a CSV parser. First, let me consider
the requirements...
                                          ┌─────────────────┐
                                          │ ↵ include header│
                                          │   detection     │
                                          └─────────────────┘
                                          [interrupt queued]

I see you'd like header detection included. I'll add that:

```typescript
function parseCSV(content: string, hasHeader = true) {
  // ...
}
```
```

---

## Configuration

### File: `claude-agent.config.ts`

```typescript
import { defineConfig } from './src/config';

export default defineConfig({
  // Model selection
  model: 'claude-sonnet-4-5-20250929',

  // Execution limits
  maxTurns: 50,
  maxThinkingTokens: 16000,

  // Tool permissions
  allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],

  // Permission mode: 'default' | 'acceptEdits' | 'bypassPermissions'
  permissionMode: 'default',

  // System prompt (optional - uses SDK default if omitted)
  systemPrompt: undefined,

  // MCP servers (optional)
  mcpServers: {},

  // Working directory (defaults to cwd)
  cwd: process.cwd(),

  // UI preferences
  ui: {
    showTokenCounts: true,
    showCost: true,
    showTiming: true,
    spinnerStyle: 'braille', // 'braille' | 'dots' | 'minimal'
    colorScheme: 'default',  // 'default' | 'light' | 'minimal'
  }
});
```

### Config Loading (`src/config.ts`)

```typescript
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';

const CONFIG_FILES = [
  'claude-agent.config.ts',
  'claude-agent.config.js',
  'claude-agent.config.mjs',
];

export async function loadConfig(): Promise<Config> {
  for (const file of CONFIG_FILES) {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      // Use tsx or native import based on extension
      const module = await import(pathToFileURL(path).href);
      return validateConfig(module.default);
    }
  }
  return getDefaultConfig();
}
```

---

## File Structure

```
claude-agent-cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── session.ts            # Session manager
│   ├── config.ts             # Config loader & validation
│   ├── types.ts              # Shared TypeScript types
│   │
│   ├── agent/
│   │   ├── bridge.ts         # SDK wrapper
│   │   └── messages.ts       # Message type handlers
│   │
│   ├── input/
│   │   ├── handler.ts        # Input orchestration
│   │   ├── readline.ts       # Readline wrapper
│   │   └── interrupt.ts      # Interrupt detection
│   │
│   └── output/
│       ├── renderer.ts       # Main render coordinator
│       ├── spinner.ts        # Animated spinners
│       ├── colors.ts         # Color definitions
│       ├── format.ts         # Text formatting utils
│       └── markdown.ts       # Markdown rendering
│
├── claude-agent.config.ts    # User configuration
├── package.json
├── tsconfig.json
└── DESIGN.md
```

---

## Dependencies

### Runtime

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/claude-agent-sdk` | Core SDK |
| `chalk` | Terminal colors |
| `ora` | Spinner animations |
| `marked` | Markdown parsing |
| `marked-terminal` | Markdown terminal rendering |
| `cli-highlight` | Syntax highlighting for code |
| `readline` | Built-in Node readline |

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `tsx` | TypeScript execution |
| `@types/node` | Node.js types |
| `esbuild` | Fast bundling (optional) |

---

## Key Behaviors

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  renderer.showMessage('\n\nGracefully shutting down...');
  await session.cleanup();
  process.exit(0);
});
```

### Error Recovery

- SDK errors: Display with stack trace, offer retry
- Network errors: Exponential backoff with spinner
- Config errors: Clear validation message, exit

### Token Streaming

```typescript
for await (const message of agentStream) {
  if (message.type === 'stream_event' && message.event.type === 'content_block_delta') {
    const delta = message.event.delta;
    if (delta.type === 'text_delta') {
      renderer.streamToken(delta.text);
    }
  }
}
```

---

## Future Considerations

*Not in scope for v1, but architecturally supported:*

- **Session persistence**: Save/restore conversation state
- **Plugin system**: Custom renderers and input handlers
- **Multi-model**: Switch models mid-conversation
- **Themes**: User-definable color schemes
- **Keyboard shortcuts**: Vim-style navigation

---

## Implementation Notes

### Streaming Input Mode

The SDK's streaming input mode is essential for interrupt support. The `query()` function accepts an async generator, allowing us to yield new messages at any time:

```typescript
const q = query({
  prompt: messageGenerator(), // AsyncIterable<SDKUserMessage>
  options: config
});
```

### Permission Handling

The CLI respects the configured `permissionMode`:
- `default`: Prompt user for tool permissions
- `acceptEdits`: Auto-accept file edits
- `bypassPermissions`: Auto-accept all (for trusted contexts)

### Terminal Raw Mode

During streaming, the terminal enters raw mode to capture keystrokes without waiting for Enter. This enables the interrupt system while preserving readline for normal prompts.

---

## Success Criteria

1. **Responsive**: <100ms input-to-display latency
2. **Stable**: No crashes during normal operation
3. **Polished**: Consistent colors, smooth animations
4. **Intuitive**: Users immediately understand how to interact
5. **Interruptible**: Can inject context without losing conversation flow
