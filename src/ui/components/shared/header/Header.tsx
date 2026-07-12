import "./Header.css";
import "@vscode/codicons/dist/codicon.css";
import Deepseek from "@/assets/DeepSeekIcon.svg";

type ViewType = "chat" | "settings" | "history";

function Header({ currentView, ViewChangeHandler }: { currentView: ViewType; ViewChangeHandler: (view: ViewType) => void }) {
  const handleLeftButton = () => {
    switch (currentView) {
      case "chat":
        return (
          <button className="historyBtn" onClick={() => ViewChangeHandler("history")} aria-label="History" data-tooltip="History" data-tooltip-position="bottom" data-tooltip-align="start">
            <span className="codicon codicon-history" />
          </button>
        );
      default:
        return (
          <button className="backBtn" onClick={() => ViewChangeHandler("chat")} aria-label="Back" data-tooltip="Back" data-tooltip-position="bottom" data-tooltip-align="start">
            <span className="codicon codicon-arrow-left" />
          </button>
        );
    }
  };

  const triggerNewConversation = () => {
    window.dispatchEvent(new CustomEvent("deepseek:newConversation"));
  };

  return (
    <header className="header">
      <div className="leftTooling">{handleLeftButton()}</div>
      <div className="center">
        <img src={Deepseek} alt="deepseek" className="logoImg" />
      </div>
      <div className="rightTooling">
        {currentView === "chat" ? (
          <>
            <button type="button" className="newChatBtn" onClick={triggerNewConversation} aria-label="New Chat" data-tooltip="New Chat" data-tooltip-position="bottom">
              <span className="codicon codicon-add" />
            </button>
          </>
        ) : null}

        <button
          className={currentView === "settings" ? "settingsBtn hidden" : "settingsBtn"}
          onClick={() => ViewChangeHandler("settings")}
          aria-label="Settings"
          data-tooltip="Settings"
          data-tooltip-position="bottom"
          data-tooltip-align="end"
        >
          <span className="codicon codicon-gear" />
        </button>
      </div>
    </header>
  );
}

export default Header;
