import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ChatView.css";
import "@vscode/codicons/dist/codicon.css";
import { InputCtrls, InputFooter, MessagesSection } from "./sections";
import { useChatConfig } from "./hooks";
import type { ApiKeyStatus, ChatMessage } from "./ChatViewTypes";
import { getVsCodeApi } from "@webview/VsCodeApi";
import type { Conversation, PermissionMode } from "@/adapters";
import { t } from "@webview/i18n";

interface ReferencedFile {
  path: string;
  name: string;
  content?: string;
  language?: string;
  type: "file" | "directory";
  size?: number;
}

type ChatCommandMessage =
  | { type: "addReferencedFiles"; files: ReferencedFile[] }
  | { type: "setDraft"; text: string }
  | { type: "activeConversationChanged"; id: string };

interface ChatViewState {
  schemaVersion: 2;
  draft: string;
  referencedFiles: ReferencedFile[];
  messages: ChatMessage[];
  conversationId?: string;
}

interface ChatViewProps {
  loadedConversation?: Conversation | null;
}

function ChatView({ loadedConversation }: ChatViewProps) {
  const savedState = getSavedChatState();
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>("missing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState(loadedConversation ? "" : (savedState?.draft ?? ""));
  const [referencedFiles, setReferencedFiles] = useState<ReferencedFile[]>(loadedConversation ? [] : (savedState?.referencedFiles ?? []));
  const [messages, setMessages] = useState<ChatMessage[]>(loadedConversation?.messages ?? savedState?.messages ?? []);
  const [conversationId, setConversationId] = useState<string | undefined>(loadedConversation?.id ?? savedState?.conversationId);
  const lastSubmittedPromptRef = useRef("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    selectedModel,
    reasoning,
    permissionMode,
    selectedModelRef,
    reasoningRef,
    applySavedConfig,
    handleReasoningChange,
    handleModelChange,
    handlePermissionModeChange,
  } = useChatConfig();

  const handleConfigLoaded = useMemo(
    () => (config: { reasoning?: string; model?: string; permissionMode?: PermissionMode }) => {
      applySavedConfig(config);
    },
    [applySavedConfig],
  );

  const handleModelChanged = useMemo(
    () => (modelId: string) => {
      applySavedConfig({ model: modelId });
    },
    [applySavedConfig],
  );

  const focusInput = () => {
    textareaRef.current?.focus();
  };

  const handleSend = (text: string) => {
    lastSubmittedPromptRef.current = text;
    setReferencedFiles([]);
  };

  const removeFile = useCallback((index: number) => {
    setReferencedFiles((files) => files.filter((_, i) => i !== index));
  }, []);

  const appendReferencedFiles = useCallback((files: ReferencedFile[]) => {
    setReferencedFiles((currentFiles) => mergeReferencedFiles(currentFiles, files));
    requestAnimationFrame(focusInput);
  }, []);

  const handleGenerationCancelled = () => {
    const lastSubmittedPrompt = lastSubmittedPromptRef.current;
    setDraft((currentDraft) => currentDraft.trim() ? currentDraft : lastSubmittedPrompt);
    requestAnimationFrame(focusInput);
  };

  const canSend = useMemo(() => {
    const trimmedDraft = draft.trim();
    return trimmedDraft.length > 0 && !isProcessing && (apiKeyStatus === "configured" || trimmedDraft.startsWith("/"));
  }, [draft, isProcessing, apiKeyStatus]);

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    const vscode = getVsCodeApi();
    vscode?.setState<ChatViewState>({ schemaVersion: 2, draft, referencedFiles, messages, conversationId });
  }, [draft, referencedFiles, messages, conversationId]);

  useEffect(() => {
    const vscode = getVsCodeApi();
    if (!vscode) {return;}

    const handleMessage = (event: MessageEvent<ChatCommandMessage>) => {
      const message = event.data;
      if (message.type === "addReferencedFiles") {
        appendReferencedFiles(message.files);
      }
      if (message.type === "setDraft") {
        setDraft(message.text);
        requestAnimationFrame(focusInput);
      }
      if (message.type === "activeConversationChanged") {
        setConversationId(message.id);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [appendReferencedFiles]);

  return (
    <div className="chatView">
      <MessagesSection
        messages={messages}
        onMessagesChange={setMessages}
        onApiKeyStatusChange={setApiKeyStatus}
        onConfigLoaded={handleConfigLoaded}
        onModelChanged={handleModelChanged}
        onProcessingChange={setIsProcessing}
        onFocusInput={focusInput}
        onGenerationCancelled={handleGenerationCancelled}
      />
      {apiKeyStatus === "missing" ? <div className="statusMessage warning">{t("chat.apiKeyMissing")}</div> : null}

      <div className="inputArea">
        <InputCtrls
          ref={textareaRef}
          input={draft}
          setInput={setDraft}
          isProcessing={isProcessing}
          canSend={canSend}
          selectedModelRef={selectedModelRef}
          reasoningRef={reasoningRef}
          placeholder={apiKeyStatus === "configured" ? t("chat.askAnythingAboutYourCode") : t("chat.configureApiKey")}
          rows={1}
          referencedFiles={referencedFiles}
          conversationId={conversationId}
          onSend={handleSend}
        />
        <InputFooter
          reasoning={reasoning}
          selectedModel={selectedModel}
          permissionMode={permissionMode}
          onModelChange={handleModelChange}
          onReasoningChange={handleReasoningChange}
          onPermissionModeChange={handlePermissionModeChange}
          referencedFiles={referencedFiles}
          onRemoveReferencedFile={removeFile}
        />
      </div>
    </div>
  );
}

function getSavedChatState(): ChatViewState | undefined {
  const state = getVsCodeApi()?.getState<Partial<ChatViewState>>();
  if (!state || typeof state !== "object" || state.schemaVersion !== 2) {
    return undefined;
  }

  return {
    schemaVersion: 2,
    draft: typeof state.draft === "string" ? state.draft : "",
    referencedFiles: Array.isArray(state.referencedFiles) ? state.referencedFiles.filter(isReferencedFile) : [],
    messages: Array.isArray(state.messages) ? (state.messages as ChatMessage[]) : [],
    conversationId: typeof state.conversationId === "string" && state.conversationId.trim() ? state.conversationId : undefined,
  };
}

function isReferencedFile(value: unknown): value is ReferencedFile {
  if (!value || typeof value !== "object") {
    return false;
  }
  const file = value as Partial<ReferencedFile>;
  return typeof file.path === "string" && typeof file.name === "string" && (file.type === "file" || file.type === "directory");
}

function mergeReferencedFiles(currentFiles: ReferencedFile[], newFiles: ReferencedFile[]): ReferencedFile[] {
  const seen = new Set(currentFiles.map((file) => file.path));
  const uniqueNewFiles = newFiles.filter((file) => {
    if (seen.has(file.path)) {
      return false;
    }
    seen.add(file.path);
    return true;
  });
  return [...currentFiles, ...uniqueNewFiles];
}

export default ChatView;
