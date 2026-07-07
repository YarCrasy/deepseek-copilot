import type { AppConfig } from "@/adapters";
import type { BaseProvider } from "./BaseProvider";
import { DeepSeekProvider } from "./providers/deepseek/DeepSeekProvider";

export function createDeepSeekProvider(config: AppConfig): BaseProvider {
  return new DeepSeekProvider(config);
}
