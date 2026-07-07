import { useEffect, useMemo, useRef, useState } from "react";
import "./ChatView.css";
import "@vscode/codicons/dist/codicon.css";
import { InputCtrls, InputFooter, MsgsHandler } from "./Sections";
import { useChatConfig } from "./hooks";
import type { ApiKeyStatus, ChatMessage } from "./ChatViewTypes";
import { getVsCodeApi } from "@webview/vscodeApi";
import type { Conversation } from "@/adapters";
import { useReferencedFilesDrop } from "./Sections/InputArea/InputFooter/useReferencedFilesDrop";

interface ReferencedFile {
  path: string;
  name: string;
  content?: string;
  language?: string;
  type: "file" | "directory";
  size?: number;
}

interface ChatViewProps {
  loadedConversation?: Conversation | null;
}

function ChatView({ loadedConversation }: ChatViewProps) {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>("missing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState("");
  const [referencedFiles, setReferencedFiles] = useState<ReferencedFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(loadedConversation?.messages ?? []);
  const lastSubmittedPromptRef = useRef("");
  const { removeFile } = useReferencedFilesDrop({
    referencedFiles,
    onReferencedFilesChange: setReferencedFiles,
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    selectedModel,
    reasoning,
    selectedModelRef,
    reasoningRef,
    applySavedConfig,
    handleReasoningChange,
    handleModelChange,
  } = useChatConfig();

  const handleConfigLoaded = useMemo(
    () => (config: { reasoning?: string; model?: string }) => {
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

  const handleGenerationCancelled = () => {
    const lastSubmittedPrompt = lastSubmittedPromptRef.current;
    if (lastSubmittedPrompt) {
      setDraft(lastSubmittedPrompt);
    }
    requestAnimationFrame(focusInput);
  };

  const canSend = useMemo(() => draft.trim().length > 0 && !isProcessing && apiKeyStatus === "configured", [draft, isProcessing, apiKeyStatus]);

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    const vscode = getVsCodeApi();
    if (!vscode) return;

    const handler = () => {
      setMessages([]);
      vscode.postMessage({ type: "newConversation" });
    };

    window.addEventListener("deepseek:newConversation", handler as EventListener);
    return () => window.removeEventListener("deepseek:newConversation", handler as EventListener);
  }, []);

  return (
    <div className="chatView">
      <MsgsHandler
        messages={messages}
        onMessagesChange={setMessages}
        onApiKeyStatusChange={setApiKeyStatus}
        onConfigLoaded={handleConfigLoaded}
        onModelChanged={handleModelChanged}
        onProcessingChange={setIsProcessing}
        onFocusInput={focusInput}
        onGenerationCancelled={handleGenerationCancelled}
      />
      {apiKeyStatus === "missing" ? <div className="statusMessage warning">API key missing</div> : null}

      <div className="inputArea">
        <InputCtrls
          ref={textareaRef}
          input={draft}
          setInput={setDraft}
          isProcessing={isProcessing}
          canSend={canSend}
          selectedModelRef={selectedModelRef}
          reasoningRef={reasoningRef}
          placeholder={apiKeyStatus === "configured" ? "Ask anything about your code..." : "Configure your API key in settings first..."}
          rows={1}
          referencedFiles={referencedFiles}
          onSend={handleSend}
        />
        <InputFooter
          reasoning={reasoning}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onReasoningChange={handleReasoningChange}
          referencedFiles={referencedFiles}
          onRemoveReferencedFile={removeFile}
        />
      </div>
    </div>
  );
}

export default ChatView;
