import "./HistoryListItem.css";
import { formatUiDate, t } from "@webview/i18n";

type Props = {
  title: string;
  onClick?: () => void;
  onDelete?: () => void;
  datetime?: Date;
  messageCount?: number;
  workspace?: string;
};

function HistoryListItem({ title, onClick, onDelete, datetime, messageCount, workspace }: Props) {
  return (
    <div className="historyListItem">
      <button className="openConversationBtn" type="button" onClick={onClick} aria-label={t("Open {title}", { title })}>
        <span className="historyContent">
          <span className="title">{title}</span>
          <span className="metadata">
            {datetime ? formatUiDate(datetime) : null}
            {messageCount !== undefined ? ` · ${t("{count} messages", { count: messageCount })}` : null}
          </span>
          {workspace ? <span className="workspace" title={workspace}>{workspace}</span> : null}
        </span>
      </button>
      <button className="deleteConversationBtn" type="button" onClick={onDelete} aria-label={t("Delete {title}", { title })}>
        <span className="codicon codicon-trash" aria-hidden="true" />
      </button>
    </div>
  );
}

export default HistoryListItem;
