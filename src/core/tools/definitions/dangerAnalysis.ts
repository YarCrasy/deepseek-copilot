import type { DangerLevel } from "../types";

interface DangerousPattern {
  pattern: RegExp;
  level: DangerLevel;
  message: string;
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
  { pattern: /\brm\s+-rf\b/, level: "destructive", message: "This will RECURSIVELY DELETE files without confirmation." },
  { pattern: /\brm\s+--recursive\b/, level: "destructive", message: "This will RECURSIVELY DELETE files without confirmation." },
  { pattern: /\bgit\s+clean\s+-(fd|df)\b/, level: "destructive", message: "This will DELETE untracked files and directories permanently." },
  { pattern: /\bgit\s+reset\s+--hard\b/, level: "destructive", message: "This will DISCARD all local changes permanently." },
  { pattern: /\bgit\s+push\s+--force\b/, level: "destructive", message: "This will FORCE-PUSH overwriting remote history." },
  { pattern: /\bgit\s+push\s+origin\s+--delete\b/, level: "destructive", message: "This will DELETE a remote branch." },
  { pattern: /\bgit\s+rebase\s+--(hard|onto)\b/, level: "destructive", message: "Git rebase rewrites commit history." },
  { pattern: /\bgit\s+update-ref\s+-d\b/, level: "destructive", message: "This will DELETE a git reference." },
  { pattern: /\bdd\b/, level: "destructive", message: "dd can overwrite disks and partitions." },
  { pattern: /\bmkfs|fdisk|parted\b/, level: "destructive", message: "Partition and filesystem operations are destructive." },
  { pattern: /\b(curl|wget)\b.*\|\s*\b(bash|sh|zsh)\b/, level: "destructive", message: "Piping internet content directly to shell is dangerous." },
  { pattern: />\s+\S+/, level: "dangerous", message: "Redirecting output can overwrite files." },
  { pattern: /\bgit\s+checkout\s+--\b/, level: "dangerous", message: "This will DISCARD local changes in working directory." },
  { pattern: /\bgit\s+branch\s+-D\b/, level: "dangerous", message: "This will FORCE-DELETE a branch." },
  { pattern: /\bsudo\b/, level: "dangerous", message: "Running with sudo can modify system files." },
  { pattern: /\bmv\s+\//, level: "dangerous", message: "Moving files to root could break the system." },
  { pattern: /\bchmod\s+-R\b/, level: "dangerous", message: "Recursive permission changes can lock you out." },
  { pattern: /\brm\b/, level: "caution", message: "This command can DELETE files permanently." },
  { pattern: /\b>\s*\/dev\//, level: "destructive", message: "Writing to /dev/ devices can corrupt disks." },
];

const SAFE_COMMANDS = new Set([
  "echo",
  "printf",
  "cat",
  "grep",
  "head",
  "tail",
  "less",
  "more",
  "which",
  "whereis",
  "whoami",
  "pwd",
  "date",
  "cal",
  "ls",
  "find",
  "locate",
  "sort",
  "uniq",
  "wc",
  "tr",
  "tee",
]);

interface ParsedCommand {
  command: string;
  args: string;
}

function parseCommand(command: string): ParsedCommand {
  const trimmed = command.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) {
    return { command: trimmed, args: "" };
  }
  return {
    command: trimmed.substring(0, firstSpace),
    args: trimmed.substring(firstSpace + 1),
  };
}

export function analyzeDangerLevel(command: string): { level: DangerLevel; message?: string } {
  const parsed = parseCommand(command);

  if (SAFE_COMMANDS.has(parsed.command)) {
    const pipeIndex = parsed.args.indexOf("|");
    if (pipeIndex !== -1) {
      return analyzeDangerLevel(parsed.args.substring(pipeIndex + 1).trim());
    }
    return { level: "safe" };
  }

  for (const { pattern, level, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return { level, message };
    }
  }

  if (/\b(write|overwrite|delete|remove|mv|cp)\b/i.test(command)) {
    return { level: "caution", message: "This command modifies files on disk." };
  }

  return { level: "safe" };
}
