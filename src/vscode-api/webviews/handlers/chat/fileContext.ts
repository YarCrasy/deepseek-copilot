export function buildFileContext(files: Array<{ path: string; content?: string; type: string }>): string {
  const parts = files.map((file) => {
    if (file.type === "directory") {
      return `[Folder: ${file.path}]`;
    }

    if (file.content) {
      const lang = file.path.split(".").pop() || "";
      return `[File: ${file.path}]
\`\`\`${lang}
${file.content}
\`\`\``;
    }

    return `[File: ${file.path} (large)]`;
  });

  return `Referenced files:
${parts.join("\n\n")}`;
}
