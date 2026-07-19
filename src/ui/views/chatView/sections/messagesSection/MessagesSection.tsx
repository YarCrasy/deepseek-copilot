import { useCallback, useEffect, useRef, useState } from "react";
import "./MessagesSection.css";
import { useVsCode } from "../../contexts";
import type { MessagesSectionProps } from "../../ChatViewTypes";
import { useMessageHandler } from "../../hooks";
import { ChatEmptyState, ChatMessages, ToolCallConfirmationModal, ToolCallTimeline } from "@webview/components/chatView";
import { useChatMessagesController, useCodeActionHandler, useToolCallController } from "../../../../hooks/chat";
import { t } from "@webview/i18n";

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
  const followsLatestRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  useMessageHandler(vscode, {
    ...chatDispatcher,
    ...tools.dispatcher,
  });

  useEffect(() => {
    if (!followsLatestRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, [messages, isProcessing, tools.activeTimelineGroups, listRef]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const followsLatest = list.scrollHeight - list.scrollTop - list.clientHeight < 72;
    followsLatestRef.current = followsLatest;
    setShowJumpToLatest(!followsLatest);
  }, [listRef]);

  const jumpToLatest = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    followsLatestRef.current = true;
    setShowJumpToLatest(false);
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [listRef]);

  const emptyStateVisible = messages.length === 0 && !isProcessing;
  return (
    <>
      <div className="msgList" ref={listRef} onClick={handleCodeAction} onScroll={handleScroll} aria-busy={isProcessing}>
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
          <div className="typingIndicator" role="status" aria-live="polite">
            <div className="typingDots">
              <span /> <span /> <span />
            </div>
            <span className="typingLabel">{t("chat.deepseekIsThinking")}</span>
          </div>
        ) : null}
      </div>
      {showJumpToLatest ? (
        <button className="jumpToLatest" type="button" onClick={jumpToLatest} aria-label={t("chat.jumpToLatest")}>
          <span className="codicon codicon-arrow-down" aria-hidden="true" />
          {t("chat.latest")}
        </button>
      ) : null}
      <span className="streamStatus srOnly" role="status" aria-live="polite">
        {isProcessing ? t("chat.streaming") : t("chat.finished")}
      </span>
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
