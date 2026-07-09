import DeepSeekLogo from "@/assets/DeepSeekIcon.svg";
import "./ChatEmptyState.css";

function ChatEmptyState() {
  return (
    <div className="emptyState">
      <img src={DeepSeekLogo} alt="DeepSeek" />
      <h2>Yar's DeepSeek Copilot</h2>
      <p>Ask about code, generate snippets, or stream reasoning directly into the editor.</p>
      <div className="emptyHints">
        <kbd>Enter</kbd> send
        <span> &middot; </span>
        <kbd>Shift+Enter</kbd> new line
      </div>
    </div>
  );
}

export default ChatEmptyState;
