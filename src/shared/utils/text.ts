export function truncateText(text: string, budget: number): string {
  if (text.length <= budget) {
    return text;
  }
  return `${text.slice(0, Math.max(0, budget - 32)).trimEnd()}\n...[truncated]`;
}

export function compactText(values: string[]): string[] {
  return values.filter((value) => value.trim().length > 0);
}
