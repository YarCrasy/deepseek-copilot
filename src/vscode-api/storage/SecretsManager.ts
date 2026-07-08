import * as vscode from "vscode";
import { API_KEY_SECRET_KEY } from "@/shared/constants";

export class SecretsManager {
  static async getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return context.secrets.get(API_KEY_SECRET_KEY);
  }

  static async setApiKey(context: vscode.ExtensionContext, key: string): Promise<void> {
    await context.secrets.store(API_KEY_SECRET_KEY, key);
  }

  static async deleteApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(API_KEY_SECRET_KEY);
  }
}
