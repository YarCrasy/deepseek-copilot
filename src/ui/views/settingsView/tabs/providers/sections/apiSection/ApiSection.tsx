import "./ApiSection.css";
import type { ApiSectionProps } from "../index";
import { Toggle } from "@webview/components/settingsView";
import { useApiConnectionState } from "./UseApiConnectionState";

function ApiSection({ config, updateConfig, saveOnBlur, modelOptions, reasoningEffortOptions }: ApiSectionProps) {
  const { apiKeyPreview, apiKeyStatusClass, handleApiKeyBlur, handleApiKeyChange, handleTestConnection, isTesting, showApiKey, toggleShowApiKey } =
    useApiConnectionState({ config, updateConfig, saveOnBlur });

  return (
    <section className="settingsSection apiSection">
      <h3 className="sectionTitle">API Configuration</h3>

      <div className="settingRow">
        <label htmlFor="apiKeyInput">API Key</label>
        <div className="inputWithAction">
          <input
            className={`apiKeyInput ${apiKeyStatusClass}`}
            id="apiKeyInput"
            type={showApiKey ? "text" : "password"}
            value={config.apiKey}
            placeholder="sk-..."
            spellCheck={false}
            onChange={handleApiKeyChange}
            onBlur={handleApiKeyBlur}
          />
          <button type="button" className="btn-icon apiKeyToggle" aria-label="Show or hide API key" data-tooltip="Show/Hide API Key" data-tooltip-align="end" onClick={toggleShowApiKey}>
            {showApiKey ? <span className="codicon codicon-eye-closed" /> : <span className="codicon codicon-eye" />}
          </button>
        </div>

        <div className="statusRow">
          <span className={`statusIndicator ${apiKeyStatusClass}`}>{apiKeyPreview}</span>
          <button type="button" className="btn-secondary" onClick={handleTestConnection} disabled={isTesting || !config.apiKey}>
            Test Connection
          </button>
        </div>
      </div>

      <div className="settingRow">
        <label htmlFor="modelSelectSettings">Model</label>
        <select
          id="modelSelectSettings"
          value={config.model}
          onChange={(event) => {
            updateConfig("model", event.target.value);
            saveOnBlur("model", event.target.value);
          }}
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Thinking Mode Toggle */}
      <Toggle
        id="thinkingModeToggle"
        label="Thinking Mode"
        checked={config.thinkingMode}
        onToggle={(checked) => {
          updateConfig("thinkingMode", checked);
          saveOnBlur("thinkingMode", checked);
        }}
      />

      {/* Reasoning effort, only when thinking mode is enabled. */}
      {config.thinkingMode && (
        <div className="settingRow">
          <label htmlFor="reasoningEffort">Reasoning Effort</label>
          <select
            id="reasoningEffort"
            value={config.reasoningEffort}
            onChange={(event) => {
              updateConfig("reasoningEffort", event.target.value);
              saveOnBlur("reasoningEffort", event.target.value);
            }}
          >
            {reasoningEffortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}

export default ApiSection;
