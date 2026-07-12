import { useState } from "react";
import "./AdvancedSection.css";
import type { AdvancedSectionProps } from "../index";
import { Slider, Toggle } from "@webview/components";

function AdvancedSection({ config, updateConfig, saveOnBlur }: AdvancedSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="settingsSection advancedSection">
      <h3 className="sectionTitle">
        <button type="button" className="collapsibleHeader" onClick={() => setCollapsed((current) => !current)}>
          Advanced
          <span className={`chevron ${collapsed ? "collapsed" : ""}`} aria-hidden="true">
            <span className="codicon codicon-chevron-down" aria-hidden="true" />
          </span>
        </button>
      </h3>

      <div className={`collapsibleContent ${collapsed ? "collapsed" : ""}`}>
        <div className="settingRow">
          <label htmlFor="baseUrlInput">Base URL</label>
          <input
            id="baseUrlInput"
            type="text"
            value={config.baseUrl}
            spellCheck={false}
            onChange={(event) => updateConfig("baseUrl", event.target.value)}
            onBlur={(event) => saveOnBlur("baseUrl", event.target.value)}
          />
        </div>

        {!config.thinkingMode && (
          <div className="settingRow">
            <Slider
              id="temperatureSlider"
              label="Temperature"
              value={config.temperature}
              min={0}
              max={1}
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
              label="Top P"
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
            <label htmlFor="maxTokensInput">Max Tokens</label>
            <input
              id="maxTokensInput"
              type="number"
              min="1"
              max="393216"
              step="1"
              value={config.maxTokens}
              onChange={(event) => updateConfig("maxTokens", Number(event.target.value))}
              onBlur={(event) => saveOnBlur("maxTokens", Number(event.target.value))}
            />
          </div>

          <div className="formatSelect">
            <label htmlFor="responseFormat">Response Format</label>
            <select
              id="responseFormat"
              value={config.responseFormat}
              onChange={(event) => {
                updateConfig("responseFormat", event.target.value);
                saveOnBlur("responseFormat", event.target.value);
              }}
            >
              <option value="text">Text</option>
              <option value="json_object">JSON Object</option>
            </select>
          </div>
        </div>

        <Toggle
          label="Enable Beta Features"
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
