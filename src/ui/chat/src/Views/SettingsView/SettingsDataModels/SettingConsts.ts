// ── Re-export desde la fuente única en types/ ──
export { DEFAULT_CONFIG } from "@/adapters/config";
export { MODEL_OPTIONS } from "@/adapters/models";

export const REASONING_EFFORT_OPTIONS = [
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

export const RESPONSE_FORMAT_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "json_object", label: "JSON Object" },
];
