import type React from "react";
import "./HistoryListItem.css";

type Props = {
  title: string;
  onClick?: () => void;
  onDelete?: () => void;
  datetime?: Date;
  messageCount?: number;
};

function HistoryListItem({ title, onClick, onDelete, datetime, messageCount }: Props) {
  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.();
  };

  return (
    <div className="historyListItem" onClick={onClick} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onClick?.()}>
      <span className="historyContent">
        <span className="title">{title}</span>
        <span className="metadata">
          {datetime ? `${datetime.toLocaleDateString()} ${datetime.toLocaleTimeString()}` : null}
          {messageCount !== undefined ? ` · ${messageCount} mensajes` : null}
        </span>
      </span>
      <button className="deleteConversationBtn" type="button" onClick={handleDelete} aria-label={`Delete ${title}`}>
        <span className="codicon codicon-trash" aria-hidden="true" />
      </button>
    </div>
  );
}

export default HistoryListItem;
