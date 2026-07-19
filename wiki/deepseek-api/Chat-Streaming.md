[Previous page: Overview](INDEX.md)

# Chat Streaming

Official reference:

- [Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion)
- [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
- [Multi-round Conversation](https://api-docs.deepseek.com/guides/multi_round_chat)

## Main path

- `src/deepseekApi/providers/deepseek/DeepSeekProvider.ts`
- `src/deepseekApi/providers/deepseek/features/Chat.ts`
- `src/vscodeApi/webviews/handlers/chat/Streaming.ts`

## Flow

1. `ChatHandler` prepares messages and configuration.
2. `createDeepSeekProvider(config.md)` creates the provider.
3. The provider always opens an SSE request for chat responses.
4. Each chunk is normalized as content or reasoning.
5. `streaming.ts` publishes events to the webview, where the UI renders accumulated deltas progressively rather than jumping per transport chunk.
6. When finished, the accumulated content is returned for history.

## DeepSeek contract

- The main endpoint is `POST /chat/completions`.
- `messages` accepts `system`, `user`, `assistant`, and `tool` roles.
- `stream: true` sends deltas through Server-Sent Events and closes with `data: [DONE]`.
- In thinking mode, reasoning arrives as `reasoning_content`, separate from `content`.
- `finish_reason` may indicate `stop`, `length`, `content_filter`, `tool_calls`, or insufficient resources.
- `usage` may include prompt, completion, cache hit/miss, and reasoning tokens.

## Cancellation

`cancelGeneration` must trigger an `AbortController` shared by the active request. The handler should publish a controlled error or close event depending on the exact cancellation point.

## Errors

Errors should arrive as `streamError` with a useful message. Do not leak the API key or full sensitive response bodies.

Review [Error Codes](https://api-docs.deepseek.com/quick_start/error_codes) before changing HTTP error mapping.

---

[Next page: Models and Configuration](Models-and-Configuration.md)
