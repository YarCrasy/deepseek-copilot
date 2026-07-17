import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConversationSummary, HandlerToWebviewMessage } from "@/adapters";
import { HistoryListItem } from "@webview/components/historyView";
import { useVsCode } from "../chatView/contexts";
import "./HistoryView.css";
import { t } from "@webview/i18n";

type SortOrder = "date_desc" | "date_asc" | "title_asc" | "title_desc";
const PAGE_SIZE = 25;

function HistoryView() {
  const vscode = useVsCode();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOrder>("date_desc");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestHistory = useCallback(() => {
    setIsLoading(true);
    setError(null);
    vscode?.postMessage({ type: "getHistory" });
  }, [vscode]);

  useEffect(() => {
    if (!vscode) {
      setIsLoading(false);
      setError(t("History is unavailable outside VS Code."));
      return;
    }

    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      const message = event.data;
      if (message.type === "history") {
        setConversations(message.conversations);
        setIsLoading(false);
        setError(null);
      } else if (message.type === "historyError") {
        setIsLoading(false);
        setError(message.error || t("History could not be loaded."));
      } else if (message.type === "conversationDeleted") {
        setConversations((current) => current.filter((conversation) => conversation.id !== message.id));
      }
    };

    window.addEventListener("message", handleMessage);
    requestHistory();
    return () => window.removeEventListener("message", handleMessage);
  }, [vscode, requestHistory]);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalizedQuery
      ? conversations.filter(
          (conversation) =>
            conversation.title.toLocaleLowerCase().includes(normalizedQuery) ||
            conversation.workspaceUri.toLocaleLowerCase().includes(normalizedQuery),
        )
      : conversations;
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date_asc": return a.updatedAt - b.updatedAt;
        case "title_asc": return a.title.localeCompare(b.title);
        case "title_desc": return b.title.localeCompare(a.title);
        case "date_desc": return b.updatedAt - a.updatedAt;
      }
    });
  }, [conversations, query, sortBy]);

  const pageCount = Math.max(1, Math.ceil(visibleConversations.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedConversations = visibleConversations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setPage(1), [query, sortBy]);
  useEffect(() => {
    if (page > pageCount) {setPage(pageCount);}
  }, [page, pageCount]);

  return (
    <div className="historyView">
      <div className="historyToolbar" aria-label={t("History controls")}>
        <div className="searchBar">
          <label className="srOnly" htmlFor="historySearch">{t("Search history")}</label>
          <input type="search" id="historySearch" placeholder={t("Search history…")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <span className="codicon codicon-search" aria-hidden="true" />
        </div>
        <label className="srOnly" htmlFor="historySort">{t("Sort history")}</label>
        <select
          className="sortBy"
          id="historySort"
          value={sortBy}
          onChange={(event) => {
            const order = parseSortOrder(event.target.value);
            if (order) {setSortBy(order);}
          }}
        >
          <option value="date_desc">{t("Date (Newest)")}</option>
          <option value="date_asc">{t("Date (Oldest)")}</option>
          <option value="title_asc">{t("Title (A-Z)")}</option>
          <option value="title_desc">{t("Title (Z-A)")}</option>
        </select>
        <button
          className="clearBtn"
          type="button"
          aria-label={t("Delete filtered history")}
          disabled={visibleConversations.length === 0 || isLoading}
          onClick={() => vscode?.postMessage({ type: "deleteConversations", ids: visibleConversations.map((conversation) => conversation.id) })}
        >
          <span className="codicon codicon-trash" aria-hidden="true" />
        </button>
      </div>

      <div className="historyList" aria-busy={isLoading} aria-live="polite">
        {isLoading ? <div className="historyState" role="status">{t("Loading history…")}</div> : null}
        {!isLoading && error ? (
          <div className="historyState historyError" role="alert">
            <span>{t("History could not be loaded.")}</span>
            <small>{error}</small>
            <button type="button" className="btn-secondary" onClick={requestHistory}>{t("Retry")}</button>
          </div>
        ) : null}
        {!isLoading && !error && visibleConversations.length === 0 ? (
          <div className="historyState">{query ? t("No conversations match your search.") : t("No history yet.")}</div>
        ) : null}
        {!isLoading && !error ? paginatedConversations.map((conversation) => (
          <HistoryListItem
            key={conversation.id}
            title={conversation.title}
            datetime={new Date(conversation.updatedAt)}
            messageCount={conversation.messageCount}
            workspace={formatWorkspaceName(conversation.workspaceUri)}
            onClick={() => vscode?.postMessage({ type: "loadConversation", id: conversation.id })}
            onDelete={() => vscode?.postMessage({ type: "deleteConversation", id: conversation.id })}
          />
        )) : null}
      </div>

      {!isLoading && !error && visibleConversations.length > PAGE_SIZE ? (
        <nav className="historyPagination" aria-label={t("History pages")}>
          <button type="button" className="btn-secondary" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t("Previous")}</button>
          <span aria-live="polite">{t("Page {page} of {pages} · {count} conversations", { page: currentPage, pages: pageCount, count: visibleConversations.length })}</span>
          <button type="button" className="btn-secondary" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{t("Next")}</button>
        </nav>
      ) : null}
    </div>
  );
}

export default HistoryView;

function parseSortOrder(value: string): SortOrder | undefined {
  return value === "date_desc" || value === "date_asc" || value === "title_asc" || value === "title_desc" ? value : undefined;
}

function formatWorkspaceName(workspaceUri: string): string {
  if (workspaceUri === "workspace:unknown") {return t("Unknown workspace");}
  try {
    const url = new URL(workspaceUri);
    const segments = decodeURIComponent(url.pathname).replace(/\/+$/, "").split("/");
    return segments.at(-1) || workspaceUri;
  } catch {
    const segments = workspaceUri.replace(/\\/g, "/").replace(/\/+$/, "").split("/");
    return segments.at(-1) || workspaceUri;
  }
}
