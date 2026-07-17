import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Header } from "@webview/components/shared";
import { ChatView, SettingsView, HistoryView } from "./views";
import { VsCodeProvider } from "./views/chatView/contexts";
import type { Conversation, HandlerToWebviewMessage } from "@/adapters";
import { getVsCodeApi } from "./VsCodeApi";

type ViewType = "chat" | "settings" | "history";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [loadedConversation, setLoadedConversation] = useState<Conversation | null>(null);
  const [chatRevision, setChatRevision] = useState(0);

  const handleNewConversation = useCallback(() => {
    const vscode = getVsCodeApi();
    vscode?.setState({ schemaVersion: 2, draft: "", referencedFiles: [], messages: [] });
    setLoadedConversation(null);
    setCurrentView("chat");
    setChatRevision((revision) => revision + 1);
    vscode?.postMessage({ type: "newConversation" });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      if (event.data.type === "conversationLoaded") {
        setLoadedConversation(event.data.conversation);
        setChatRevision((revision) => revision + 1);
        setCurrentView("chat");
      } else if (event.data.type === "conversationDeleted") {
        const deletedId = event.data.id;
        setLoadedConversation((current) => (current?.id === deletedId ? null : current));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <VsCodeProvider>
      <div className="app">
        <Header currentView={currentView} ViewChangeHandler={setCurrentView} onNewConversation={handleNewConversation} />
        <div className={`viewPane ${currentView === "chat" ? "active" : "hidden"}`} aria-hidden={currentView !== "chat"}>
          <ChatView key={chatRevision} loadedConversation={loadedConversation} />
        </div>
        {currentView === "settings" ? (
          <div className="viewPane active">
            <SettingsView />
          </div>
        ) : null}
        {currentView === "history" ? (
          <div className="viewPane active">
            <HistoryView />
          </div>
        ) : null}
      </div>
    </VsCodeProvider>
  );
}

export default App;
