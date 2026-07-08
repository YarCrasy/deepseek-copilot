import type { AppConfig } from "@/adapters";

// SettingsConfig is an AppConfig alias for webview code.
export type SettingsConfig = AppConfig;

export type ApiKeyStatus = "missing" | "configured" | "testing";

export type UpdateConfigFn = (key: string, value: unknown) => void;
export type SaveOnBlurFn = (key: string, value: unknown) => void;
