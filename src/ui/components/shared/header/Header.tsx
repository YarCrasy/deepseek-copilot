import "./Header.css";
import "@vscode/codicons/dist/codicon.css";
import Deepseek from "@/assets/DeepSeekIcon.svg";
import { t } from "@webview/i18n";

type ViewType = "chat" | "settings" | "history";

function Header({ currentView, ViewChangeHandler, onNewConversation }: { currentView: ViewType; ViewChangeHandler: (view: ViewType) => void; onNewConversation: () => void }) {
  const handleLeftButton = () => {
    switch (currentView) {
      case "chat":
        return (
          <button className="historyBtn" onClick={() => ViewChangeHandler("history")} aria-label={t("History")} data-tooltip={t("History")} data-tooltip-position="bottom" data-tooltip-align="start">
            <span className="codicon codicon-history" />
          </button>
        );
      default:
        return (
          <button className="backBtn" onClick={() => ViewChangeHandler("chat")} aria-label={t("Back")} data-tooltip={t("Back")} data-tooltip-position="bottom" data-tooltip-align="start">
            <span className="codicon codicon-arrow-left" />
          </button>
        );
    }
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
            <button type="button" className="newChatBtn" onClick={onNewConversation} aria-label={t("New Chat")} data-tooltip={t("New Chat")} data-tooltip-position="bottom">
              <span className="codicon codicon-add" />
            </button>
          </>
        ) : null}

        <button
          className={currentView === "settings" ? "settingsBtn hidden" : "settingsBtn"}
          onClick={() => ViewChangeHandler("settings")}
          aria-label={t("Settings")}
          data-tooltip={t("Settings")}
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
