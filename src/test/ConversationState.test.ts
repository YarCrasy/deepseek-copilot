import * as assert from "assert";
import type { AssistantTimelineEvent, Conversation } from "@/adapters";
import { ConversationState } from "@/core/chat/ConversationState";

suite("ConversationState", () => {
  test("persists timeline events and derives API reasoning without control markers", async () => {
    let saved: Conversation | undefined;
    const state = new ConversationState({
      save: async (conversation) => {
        saved = conversation;
      },
    });
    const timeline: AssistantTimelineEvent[] = [
      { id: "reasoning-1", type: "reasoning", content: "Inspect workspace. " },
      { id: "tools-1", type: "tool-group", round: 1, toolCallIds: ["call-1"] },
      { id: "reasoning-2", type: "reasoning", content: "Use the result." },
      { id: "content-1", type: "content", content: "Done." },
    ];

    const userMessage = state.createMessage("user", "Do it");
    const assistantMessage = state.createMessage("assistant", "Done.", {
      timeline,
      toolCalls: [
        {
          toolCallId: "call-1",
          toolName: "list_directory",
          arguments: "{}",
          result: "listed: .",
          round: 1,
          status: "completed",
        },
      ],
    });

    await state.saveTurn({ userMessage, assistantMessage, model: "test-model" });

    assert.deepStrictEqual(saved?.messages[1].timeline, timeline);
    const apiMessages = state.getApiMessages();
    assert.strictEqual(apiMessages[1].reasoning_content, "Inspect workspace. Use the result.");
    assert.strictEqual(apiMessages[1].content, "Done.");
    assert.strictEqual(apiMessages[1].content?.includes("YDSC_TOOL_ROUND"), false);
  });
});
