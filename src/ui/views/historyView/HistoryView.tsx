import { useEffect, useMemo, useState } from "react";
import type { Conversation, HandlerToWebviewMessage } from "@/adapters";
import { useVsCode } from "../chatView/contexts";
import HistoryListItem from "./historyListItem/HistoryListItem";
import "./HistoryView.css";

function HistoryView() {
  const vscode = useVsCode();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    if (!vscode) return;

    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      const message = event.data;
      if (message.type === "history") {
        setConversations(message.conversations);
      } else if (message.type === "conversationDeleted") {
        setConversations((current) => current.filter((conversation) => conversation.id !== message.id));
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "getHistory" });
    return () => window.removeEventListener("message", handleMessage);
  }, [vscode]);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(normalizedQuery)) : conversations;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return a.updatedAt - b.updatedAt;
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "date_desc":
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [conversations, query, sortBy]);

  const deleteAllVisible = () => {
    visibleConversations.forEach((conversation) => vscode?.postMessage({ type: "deleteConversation", id: conversation.id }));
  };

  return (
    <div className="historyView">
      <div className="historyToolbar">
        <div className="searchBar">
          <input type="text" name="search" id="search" placeholder="Search history..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <span className="codicon codicon-search" />
        </div>
        <select className="sortBy" name="sortBy" id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="date_desc">Date (Newest)</option>
          <option value="date_asc">Date (Oldest)</option>
          <option value="title_asc">Title (A-Z)</option>
          <option value="title_desc">Title (Z-A)</option>
        </select>
        <button className="clearBtn" type="button" aria-label="Clear history" disabled={visibleConversations.length === 0} onClick={deleteAllVisible}>
          <span className="codicon codicon-trash" aria-hidden="true" />
        </button>
      </div>
      <div className="historyList">
        {visibleConversations.length === 0 ? (
          <div className="historyEmptyState">No history</div>
        ) : (
          visibleConversations.map((conversation) => (
            <HistoryListItem
              key={conversation.id}
              title={conversation.title}
              datetime={new Date(conversation.updatedAt)}
              messageCount={conversation.messages.length}
              onClick={() => vscode?.postMessage({ type: "loadConversation", id: conversation.id })}
              onDelete={() => vscode?.postMessage({ type: "deleteConversation", id: conversation.id })}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HistoryView;
