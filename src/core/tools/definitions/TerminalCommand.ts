import type { ToolDefinition } from "@/adapters";
import type { RegisteredTool, ToolHandlerContext, ToolMetadata } from "../Types";
import { analyzeDangerLevel } from "./DangerAnalysis";
import { executeWorkspaceCommand } from "./ShellExecution";

async function handleTerminalCommand(args: Record<string, unknown>, context?: ToolHandlerContext): Promise<string> {
  const command = args.command as string;
  const cwd = args.cwd as string | undefined;

  if (!command) {
    return "Error: command parameter is required";
  }

  const analysis = analyzeDangerLevel(command);

  if (analysis.level === "destructive" || analysis.level === "dangerous") {
    return JSON.stringify({
      requiresConfirmation: true,
      dangerLevel: analysis.level,
      warningMessage: analysis.message,
      command,
    });
  }

  return executeWorkspaceCommand(command, cwd, context?.signal);
}

async function handleTerminalCommandForced(args: Record<string, unknown>, context?: ToolHandlerContext): Promise<string> {
  const command = args.command as string;
  const cwd = args.cwd as string | undefined;

  if (!command) {
    return "Error: command parameter is required";
  }

  return executeWorkspaceCommand(command, cwd, context?.signal);
}

export const terminalCommandDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "run_terminal_command",
    description:
      "Run a command in the workspace terminal. Its successful output is authoritative; do not follow it with verification-only reads or directory listings unless the output is ambiguous or the user requested verification. Warning: destructive commands such as rm or git reset --hard require explicit confirmation. Timeout: 30 seconds.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Command to run.",
        },
        cwd: {
          type: "string",
          description: "Working directory relative to the workspace. Defaults to the root.",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
  },
};

export const terminalCommandHandler: RegisteredTool["handler"] = handleTerminalCommand;
export const terminalCommandHandlerForced: RegisteredTool["handler"] = handleTerminalCommandForced;

export const terminalCommandMetadata: ToolMetadata = {
  dangerLevel: "dangerous",
  warningMessage: "Shell commands can modify, delete, or damage files. Review the command carefully before executing.",
  requiresConfirmation: true,
};
