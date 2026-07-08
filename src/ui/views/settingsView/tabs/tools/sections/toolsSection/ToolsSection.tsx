import { PERMISSION_MODE_ALLOWED_TOOLS } from "@/adapters";
import type { PermissionMode, ToolExecutionMode, ToolExecutionModes } from "@/adapters";
import type { ToolsSectionProps } from "..";
import "./ToolsSection.css";

const PERMISSION_MODE_OPTIONS: Array<{ value: PermissionMode; label: string }> = [
  { value: "chat", label: "Chat" },
  { value: "read-only", label: "Read only" },
  { value: "workspace", label: "Workspace" },
  { value: "full-access", label: "Full access" },
];

const TOOL_MODE_OPTIONS: Array<{ value: ToolExecutionMode; label: string }> = [
  { value: "disabled", label: "Disabled" },
  { value: "enabled", label: "Enabled" },
  { value: "auto_approve", label: "Auto approve" },
];

function ToolsSection({ config, tools, updateConfig, saveOnBlur }: ToolsSectionProps) {
  const updatePermissionMode = (permissionMode: PermissionMode) => {
    updateConfig("permissionMode", permissionMode);
    saveOnBlur("permissionMode", permissionMode);
  };

  const updateToolMode = (toolName: string, mode: ToolExecutionMode) => {
    const nextModes: ToolExecutionModes = {
      ...config.toolExecutionModes,
      [toolName]: mode,
    };

    updateConfig("toolExecutionModes", nextModes);
    saveOnBlur("toolExecutionModes", nextModes);
  };

  return (
    <section className="settingsSection toolsSection">
      <h3 className="sectionTitle">Tools</h3>

      <div className="permissionModeRow">
        <label className="permissionModeLabel" htmlFor="permissionMode">
          Permission mode
        </label>
        <select
          id="permissionMode"
          className="permissionModeSelect"
          aria-label="Permission mode"
          value={config.permissionMode}
          onChange={(event) => updatePermissionMode(event.target.value as PermissionMode)}
        >
          {PERMISSION_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolsList">
        {tools.filter((tool) => isToolAllowedByPermissionMode(config.permissionMode, tool.name)).map((tool) => {
          const mode = config.toolExecutionModes[tool.name] ?? "enabled";
          return (
            <div className="toolSettingRow" key={tool.name}>
              <span className="toolSettingInfo">
                <span className="toolSettingName" data-tooltip={tool.description} data-tooltip-position="bottom" data-tooltip-align="start" aria-label={`${tool.name}: ${tool.description}`}>
                  {tool.name}
                </span>
              </span>

              <select
                className="toolModeSelect"
                aria-label={`${tool.name} mode`}
                value={mode}
                onChange={(event) => updateToolMode(tool.name, event.target.value as ToolExecutionMode)}
              >
                {TOOL_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ToolsSection;

function isToolAllowedByPermissionMode(permissionMode: PermissionMode, toolName: string): boolean {
  const allowedToolNames = PERMISSION_MODE_ALLOWED_TOOLS[permissionMode];
  return allowedToolNames === null || allowedToolNames.includes(toolName);
}
