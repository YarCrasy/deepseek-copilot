import type { DangerLevel } from "../Types";

interface DangerousPattern { pattern: RegExp; level: DangerLevel; message: string }

const PATTERNS: DangerousPattern[] = [
  { pattern: /\b(?:rm\s+-(?:rf|fr)|remove-item\b[^\r\n;|]*(?:-recurse|-force)|rmdir\s+\/s|del\s+\/(?:f|s|q))\b/i, level: "destructive", message: "This command can recursively or forcibly delete files." },
  { pattern: /\bgit\s+(?:reset\s+--hard|clean\s+-[a-z]*[fd][a-z]*|push\b[^\r\n;|]*--force|push\s+origin\s+--delete|update-ref\s+-d)\b/i, level: "destructive", message: "This Git operation can permanently discard data or rewrite remote history." },
  { pattern: /\b(?:format(?:-volume)?|clear-disk|initialize-disk|mkfs|fdisk|parted|diskpart|dd)\b/i, level: "destructive", message: "Disk and filesystem operations can destroy data." },
  { pattern: /\b(?:curl|wget|invoke-webrequest|iwr)\b[^|]*\|\s*(?:&\s*)?\b(?:bash|sh|zsh|powershell|pwsh|iex|invoke-expression)\b/i, level: "destructive", message: "Executing downloaded content directly is unsafe." },
  { pattern: /\b(?:npm|pnpm|yarn|bun|vsce|ovsx)\s+publish\b/i, level: "dangerous", message: "Publishing has external side effects." },
  { pattern: /\b(?:firebase|vercel|netlify|wrangler|kubectl|helm|terraform)\s+(?:deploy|publish|apply|destroy)\b/i, level: "dangerous", message: "Deployment or infrastructure changes have external side effects." },
  { pattern: /\b(?:git\s+push|gh\s+(?:pr|release)|npm\s+(?:login|token)|docker\s+push)\b/i, level: "dangerous", message: "This command changes remote state or credentials." },
  { pattern: /(?:^|[^>])>(?!>)\s*[^&]/, level: "dangerous", message: "Output redirection can overwrite files." },
  { pattern: /\b(?:sudo|runas|start-process\b[^\r\n;|]*-verb\s+runas|set-executionpolicy)\b/i, level: "dangerous", message: "Elevated execution can modify the system." },
  { pattern: /\b(?:git\s+checkout\s+--|git\s+branch\s+-D|chmod\s+-R|move-item|copy-item|new-item|set-content|add-content|out-file)\b/i, level: "dangerous", message: "This command can overwrite or discard files." },
  { pattern: /\b(?:rm|del|erase|rmdir|remove-item)\b/i, level: "caution", message: "This command deletes files." },
  { pattern: /\b(?:npm|pnpm|yarn|bun)\s+(?:install|add|remove|update|exec|dlx)\b/i, level: "caution", message: "Package manager commands can execute scripts and modify the workspace." },
];

const SAFE_PROGRAMS = new Set(["echo", "printf", "cat", "grep", "head", "tail", "less", "more", "which", "where", "whereis", "whoami", "pwd", "date", "ls", "dir", "get-childitem", "get-location", "git"]);
const LEVEL_RANK: Record<DangerLevel, number> = { safe: 0, caution: 1, dangerous: 2, destructive: 3 };

export function analyzeDangerLevel(command: string): { level: DangerLevel; message?: string } {
  const segments = splitShellSegments(command);
  let result: { level: DangerLevel; message?: string } = analyzeSegment(command);
  for (const segment of segments) {
    const analysis = analyzeSegment(segment);
    if (LEVEL_RANK[analysis.level] > LEVEL_RANK[result.level]) {result = analysis;}
  }
  return result;
}

function analyzeSegment(segment: string): { level: DangerLevel; message?: string } {
  for (const item of PATTERNS) {
    if (item.pattern.test(segment)) {return { level: item.level, message: item.message };}
  }
  if (/[$`]\(|%[^%]+%|\$env:|-[Ee]ncodedCommand\b|\biex\b/i.test(segment)) {
    return { level: "dangerous", message: "Dynamic or encoded shell execution cannot be reviewed reliably." };
  }
  const program = segment.trim().match(/^(?:&\s*)?["']?([\w.-]+)/)?.[1]?.toLowerCase();
  if (program && SAFE_PROGRAMS.has(program) && isKnownReadOnlyGit(segment)) {return { level: "safe" };}
  if (program && SAFE_PROGRAMS.has(program) && program !== "git") {return { level: "safe" };}
  return { level: "caution", message: "Unknown shell commands require review because their effects cannot be proven safe." };
}

function isKnownReadOnlyGit(segment: string): boolean {
  return /^\s*git\s+(?:status|diff|log|show|branch(?:\s+--show-current)?|rev-parse|ls-files)\b/i.test(segment);
}

function splitShellSegments(command: string): string[] {
  return command.split(/\|\||&&|[;|\r\n]+/).map((part) => part.trim()).filter(Boolean);
}
