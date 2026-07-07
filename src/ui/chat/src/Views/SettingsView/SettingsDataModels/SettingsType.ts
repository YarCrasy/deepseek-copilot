import type { AppConfig } from "@/adapters";

// SettingsConfig es un alias de AppConfig para uso en el webview
export type SettingsConfig = AppConfig;

export type ApiKeyStatus = "missing" | "configured" | "testing";

export type UpdateConfigFn = (key: string, value: unknown) => void;
export type SaveOnBlurFn = (key: string, value: unknown) => void;
