import { useCallback, useEffect } from "react";
import "./MsgsHandler.css";
import { useVsCode } from "../../contexts";
import type { MsgsHandlerProps } from "../../ChatViewTypes";
import { useMessageHandler } from "../../hooks";
import EmptyState from "./MsgsEmptyState";
import MessageArticles from "./MessageArticles";
import ToolCallTimeline from "./ToolCallTimeline";
import { useChatMessagesController } from "./useChatMessagesController";
import { useCodeActionHandler } from "./useCodeActionHandler";
import { useToolCallController } from "./useToolCallController";

function MsgsHandler({
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
}: MsgsHandlerProps) {
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
  }, [messages, isProcessing, listRef]);

  const emptyStateVisible = messages.length === 0 && !isProcessing;

  return (
    <div className="msgList" ref={listRef} onClick={handleCodeAction}>
      {emptyStateVisible ? (
        <EmptyState />
      ) : (
        <>
          <MessageArticles
            messages={messages}
            renderToolCallGroups={(groups) => (
              <ToolCallTimeline
                groups={groups}
                vscode={vscode}
                onExecute={tools.handleExecute}
                onReject={tools.handleReject}
                onExecuteAll={tools.handleExecuteAll}
                onRejectAll={tools.handleRejectAll}
              />
            )}
          />
          <ToolCallTimeline
            groups={tools.activeTimelineGroups}
            vscode={vscode}
            onExecute={tools.handleExecute}
            onReject={tools.handleReject}
            onExecuteAll={tools.handleExecuteAll}
            onRejectAll={tools.handleRejectAll}
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
  );
}

export default MsgsHandler;
