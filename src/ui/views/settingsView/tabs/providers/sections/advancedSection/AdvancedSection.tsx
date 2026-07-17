import { useState } from "react";
import "./AdvancedSection.css";
import type { AdvancedSectionProps } from "../index";
import { Slider, Toggle } from "@webview/components/settingsView";
import { t } from "@webview/i18n";

function AdvancedSection({ config, updateConfig, saveOnBlur }: AdvancedSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="settingsSection advancedSection">
      <h3 className="sectionTitle">
        <button
          type="button"
          className="collapsibleHeader"
          aria-expanded={!collapsed}
          aria-controls="advanced-settings-content"
          onClick={() => setCollapsed((current) => !current)}
        >
          {t("Advanced")}
          <span className={`chevron ${collapsed ? "collapsed" : ""}`} aria-hidden="true">
            <span className="codicon codicon-chevron-down" aria-hidden="true" />
          </span>
        </button>
      </h3>

      <div id="advanced-settings-content" className={`collapsibleContent ${collapsed ? "collapsed" : ""}`} hidden={collapsed}>
        <div className="settingRow">
          <label htmlFor="baseUrlInput">{t("Base URL")}</label>
          <input
            id="baseUrlInput"
            type="text"
            value={config.baseUrl}
            spellCheck={false}
            onChange={(event) => updateConfig("baseUrl", event.target.value)}
            onBlur={(event) => saveOnBlur("baseUrl", event.target.value)}
          />
          {config.baseUrl.startsWith("http://") ? <small className="settingWarning">{t("Warning: HTTP sends API credentials without transport encryption.")}</small> : null}
          {!config.baseUrl.startsWith("https://api.deepseek.com") ? <small className="settingWarning">{t("Custom API host: verify that you trust its operator.")}</small> : null}
        </div>

        {!config.thinkingMode && (
          <div className="settingRow">
            <Slider
              id="temperatureSlider"
              label={t("Temperature")}
              value={config.temperature}
              min={0}
              max={2}
              step={0.05}
              disabled={config.thinkingMode}
              onChange={(value) => updateConfig("temperature", value)}
              onBlur={(value) => saveOnBlur("temperature", value)}
            />
          </div>
        )}
        {!config.thinkingMode && (
          <div className="settingRow">
            <Slider
              id="topPSlider"
              label={t("Top P")}
              value={config.topP}
              min={0}
              max={1}
              step={0.05}
              disabled={config.thinkingMode}
              onChange={(value) => updateConfig("topP", value)}
              onBlur={(value) => saveOnBlur("topP", value)}
            />
          </div>
        )}

        <div className="settingRow formatAndTokens">
          <div className="numInput">
            <label htmlFor="maxTokensInput">{t("Max Tokens")}</label>
            <input
              id="maxTokensInput"
              type="number"
              min="1"
              max="65536"
              step="1"
              value={config.maxTokens}
              onChange={(event) => updateBoundedInteger(event.currentTarget, 1, 65_536, (value) => updateConfig("maxTokens", value))}
              onBlur={(event) => updateBoundedInteger(event.currentTarget, 1, 65_536, (value) => saveOnBlur("maxTokens", value))}
            />
          </div>
          <div className="settingRow">
            <label htmlFor="maxToolRoundsInput">{t("Max tool rounds")}</label>
            <input
              id="maxToolRoundsInput"
              type="number"
              min={1}
              max={20}
              value={config.maxToolRounds}
              onChange={(event) => updateBoundedInteger(event.currentTarget, 1, 20, (value) => updateConfig("maxToolRounds", value))}
              onBlur={(event) => updateBoundedInteger(event.currentTarget, 1, 20, (value) => saveOnBlur("maxToolRounds", value))}
            />
          </div>

          <div className="formatSelect">
            <label htmlFor="responseFormat">{t("Response Format")}</label>
            <select
              id="responseFormat"
              value={config.responseFormat}
              onChange={(event) => {
                const format = parseResponseFormat(event.target.value);
                if (!format) {return;}
                updateConfig("responseFormat", format);
                saveOnBlur("responseFormat", format);
              }}
            >
              <option value="text">{t("Text")}</option>
              <option value="json_object">{t("JSON Object")}</option>
            </select>
          </div>
        </div>

        <Toggle
          label={t("Store chat history")}
          id="historyEnabled"
          checked={config.historyEnabled}
          onToggle={(checked) => {
            updateConfig("historyEnabled", checked);
            saveOnBlur("historyEnabled", checked);
          }}
        />
        <div className="settingRow">
          <label htmlFor="historyRetentionDays">{t("History retention days (0 = unlimited)")}</label>
          <input
            id="historyRetentionDays"
            type="number"
            min={0}
            max={3650}
            value={config.historyRetentionDays}
            disabled={!config.historyEnabled}
            onChange={(event) => updateBoundedInteger(event.currentTarget, 0, 3650, (value) => updateConfig("historyRetentionDays", value))}
            onBlur={(event) => updateBoundedInteger(event.currentTarget, 0, 3650, (value) => saveOnBlur("historyRetentionDays", value))}
          />
        </div>

        <Toggle
          label={t("Use global AGENTS.md instructions")}
          id="includeHomeAgents"
          checked={config.includeHomeAgents}
          onToggle={(checked) => {
            updateConfig("includeHomeAgents", checked);
            saveOnBlur("includeHomeAgents", checked);
          }}
        />

        <Toggle
          label={t("Enable Beta Features")}
          id="enableBetaFeatures"
          checked={config.enableBetaFeatures}
          onToggle={(checked) => {
            updateConfig("enableBetaFeatures", checked);
            saveOnBlur("enableBetaFeatures", checked);
          }}
        />
      </div>
    </section>
  );
}

export default AdvancedSection;

function updateBoundedInteger(input: HTMLInputElement, min: number, max: number, update: (value: number) => void): void {
  const value = input.valueAsNumber;
  if (Number.isInteger(value) && value >= min && value <= max) {update(value);}
}

function parseResponseFormat(value: string): "text" | "json_object" | undefined {
  return value === "text" || value === "json_object" ? value : undefined;
}
