import { useEffect, useState } from "react";
import "./App.css";
import { Header } from "@webview/components/shared";
import { ChatView, SettingsView, HistoryView } from "./views";
import { VsCodeProvider } from "./views/chatView/contexts";
import type { Conversation, HandlerToWebviewMessage } from "@/adapters";

type ViewType = "chat" | "settings" | "history";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [loadedConversation, setLoadedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      if (event.data.type === "conversationLoaded") {
        setLoadedConversation(event.data.conversation);
        setCurrentView("chat");
      }
    };

    const handleNewConversation = () => {
      setLoadedConversation(null);
      setCurrentView("chat");
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("deepseek:newConversation", handleNewConversation);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("deepseek:newConversation", handleNewConversation);
    };
  }, []);

  return (
    <VsCodeProvider>
      <div className="app">
        <Header currentView={currentView} ViewChangeHandler={setCurrentView} />
        <div className={`viewPane ${currentView === "chat" ? "active" : "hidden"}`} aria-hidden={currentView !== "chat"}>
          <ChatView key={loadedConversation?.id ?? "active-conversation"} loadedConversation={loadedConversation} />
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
