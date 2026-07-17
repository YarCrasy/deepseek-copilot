import { AdvancedSection, ApiSection } from "./sections";
import type { SettingsConfig, UpdateConfigFn, SaveOnBlurFn } from "../../settingsDataModels";
import type { AppConfig } from "@/adapters";

interface ProvidersTabProps {
  config: SettingsConfig;
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
  modelOptions: Array<{ value: string; label: string }>;
  reasoningEffortOptions: ReadonlyArray<{ value: NonNullable<AppConfig["reasoningEffort"]>; label: string }>;
}

function ProvidersTab({ config, updateConfig, saveOnBlur, modelOptions, reasoningEffortOptions }: ProvidersTabProps) {
  return (
    <>
      <ApiSection
        config={config}
        updateConfig={updateConfig}
        saveOnBlur={saveOnBlur}
        modelOptions={modelOptions}
        reasoningEffortOptions={reasoningEffortOptions}
      />

      <AdvancedSection config={config} updateConfig={updateConfig} saveOnBlur={saveOnBlur} />
    </>
  );
}

export default ProvidersTab;
