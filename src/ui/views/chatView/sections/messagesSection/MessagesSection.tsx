import { useCallback, useEffect } from "react";
import "./MessagesSection.css";
import { useVsCode } from "../../contexts";
import type { MessagesSectionProps } from "../../ChatViewTypes";
import { useMessageHandler } from "../../hooks";
import { ChatEmptyState, ChatMessages, ToolCallConfirmationModal, ToolCallTimeline } from "@webview/components/chatView";
import { useChatMessagesController, useCodeActionHandler, useToolCallController } from "../../../../hooks/chat";

function MessagesSection({
  messages: externalMessages,
  onMessagesChange,
  isProcessing: externalIsProcessing,
  listRef: externalListRef,
  onApiKeyStatusChange,
  onConfigLoaded,
  onModelChanged,
  onProcessingChange,
  onGenerationCancelled,
  onFocusInput,
}: MessagesSectionProps) {
  const vscode = useVsCode();
  const focusInput = useCallback(() => onFocusInput?.(), [onFocusInput]);
  const handleCodeAction = useCodeActionHandler(vscode);

  const chat = useChatMessagesController({
    externalMessages,
    externalSetMessages: onMessagesChange,
    externalIsProcessing,
    externalListRef,
    onApiKeyStatusChange,
    onConfigLoaded,
    onModelChanged,
    onProcessingChange,
    onGenerationCancelled,
    focusInput,
  });

  const tools = useToolCallController({
    messages: chat.messages,
    isProcessing: chat.isProcessing,
    vscode,
  });
  const { dispatcher: chatDispatcher, isProcessing, listRef, messages } = chat;

  useMessageHandler(vscode, {
    ...chatDispatcher,
    ...tools.dispatcher,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, [messages, isProcessing, tools.activeTimelineGroups, listRef]);

  const emptyStateVisible = messages.length === 0 && !isProcessing;
  return (
    <>
      <div className="msgList" ref={listRef} onClick={handleCodeAction}>
        {emptyStateVisible ? (
          <ChatEmptyState />
        ) : (
          <>
            <ChatMessages
              messages={messages}
              activeToolCallGroups={tools.activeTimelineGroups}
              renderToolCallGroups={(groups) => (
                <ToolCallTimeline
                  groups={groups}
                  vscode={vscode}
                />
              )}
            />
          </>
        )}

        {isProcessing ? (
          <div className="typingIndicator" aria-live="polite">
            <div className="typingDots">
              <span /> <span /> <span />
            </div>
            <span className="typingLabel">DeepSeek is thinking...</span>
          </div>
        ) : null}
      </div>
      <ToolCallConfirmationModal
        pendingToolCalls={tools.pendingToolCalls}
        onExecute={tools.handleExecute}
        onReject={tools.handleReject}
        onExecuteAll={tools.handleExecuteAll}
        onRejectAll={tools.handleRejectAll}
      />
    </>
  );
}

export default MessagesSection;
