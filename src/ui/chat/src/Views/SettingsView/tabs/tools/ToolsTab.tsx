import type { AvailableToolInfo } from "@/adapters";
import { ToolsSection } from "./sections";
import type { SettingsConfig, UpdateConfigFn, SaveOnBlurFn } from "../../SettingsDataModels";

interface ToolsTabProps {
  config: SettingsConfig;
  tools: AvailableToolInfo[];
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
}

function ToolsTab({ config, tools, updateConfig, saveOnBlur }: ToolsTabProps) {
  return <ToolsSection config={config} tools={tools} updateConfig={updateConfig} saveOnBlur={saveOnBlur} />;
}

export default ToolsTab;
