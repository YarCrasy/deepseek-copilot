import type { PageContent } from "../types";

export const technicalDecisions: PageContent = {
  navTitle: "Decisiones técnicas",
  title: "Decisiones técnicas",
  description: "Decisiones de arquitectura de DeepSeek Copilot.",
  lead: "La extensión separa VS Code API, DeepSeek API, lógica core de tools y UI React.",
  sections: [
    {
      title: "Reglas",
      items: [
        "core no debe importar vscode, React ni clientes HTTP concretos.",
        "deepseek-api contiene protocolo DeepSeek, streaming, modelos y requests de tool calls.",
        "vscode-api contiene activación, comandos, webviews, workspace, archivos y terminal.",
        "ui contiene la webview React y comunica solo mediante el contrato compartido.",
        "web-doc usa Astro y debe soportar inglés, español y chino.",
      ],
    },
  ],
};
