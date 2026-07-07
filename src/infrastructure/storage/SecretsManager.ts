import * as vscode from "vscode";

const SECRET_KEY = "deepseek-copilot.apiKey";

export class SecretsManager {
  static async getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return context.secrets.get(SECRET_KEY);
  }

  static async setApiKey(context: vscode.ExtensionContext, key: string): Promise<void> {
    await context.secrets.store(SECRET_KEY, key);
  }

  static async deleteApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(SECRET_KEY);
  }
}
