import type { ChatRole } from "../ChatViewTypes";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const CODE_BLOCK_TOKEN = (index: number) => `{CODEBLOCK_${index}}`;

/**
 * Convierte texto markdown simplificado a HTML seguro.
 * Soporta: bloques de codigo, inline code, negrita, cursiva, enlaces, parrafos.
 *
 * @param content - Texto markdown a renderizar
 * @param role - Rol del mensaje ("assistant" para boton Insert, otros roles no)
 * @returns HTML sanitizado listo para dangerouslySetInnerHTML
 */
export function renderRichText(content: string, role: ChatRole): string {
  if (!content) {
    return "";
  }

  const codeBlocks: string[] = [];

  // -- 1. Extraer y procesar bloques de codigo ANTES de escapar HTML --
  // La regex opera sobre el contenido raw (no escapado) para poder detectar los backticks
  const rawProcessed = content.replace(/```(\w*)\n([\s\S]*?)```/g, (_match: string, lang: string, code: string) => {
    const language = (lang || "code").toLowerCase();
    const codeClean = escapeHtml(code.trimEnd());
    const insertButton = role === "assistant" ? '<button type="button" class="code-action-btn" data-code-action="insert">Insert</button>' : "";

    const token = CODE_BLOCK_TOKEN(codeBlocks.length);
    codeBlocks.push(
      [
        '<div class="code-block">',
        '<div class="code-block-header">',
        `<span class="lang-label">${language}</span>`,
        '<span class="code-actions">',
        '<button type="button" class="code-action-btn" data-code-action="copy">Copy</button>',
        insertButton,
        "</span>",
        "</div>",
        `<code>${codeClean}</code>`,
        "</div>",
      ].join(""),
    );

    return token;
  });

  // -- 2. Escapar el resto del HTML (ya sin bloques de codigo) --
  let escaped = escapeHtml(rawProcessed);

  // -- 3. Formatear markdown inline --
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // -- 4. Parrafos (separados por doble salto de linea) --
  const paragraphs = escaped.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    escaped = paragraphs.map((paragraph) => (paragraph.trim() ? `<p>${paragraph.replace(/\n/g, "<br />")}</p>` : "")).join("");
  } else {
    escaped = escaped.replace(/\n/g, "<br />");
  }

  // -- 5. Restaurar bloques de codigo --
  codeBlocks.forEach((block, index) => {
    escaped = escaped.replace(CODE_BLOCK_TOKEN(index), block);
  });

  return escaped;
}
