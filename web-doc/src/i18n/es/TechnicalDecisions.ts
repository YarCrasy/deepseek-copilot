import type { PageContent } from "../Types";

export const technicalDecisions: PageContent = {
  navTitle: "Decisiones técnicas",
  title: "Decisiones técnicas",
  description: "Decisiones de arquitectura de Yar's DeepSeek Copilot.",
  lead: "La extensión separa VS Code API, DeepSeek API, lógica core de tools y UI React.",
  sections: [
    {
      title: "Reglas",
      items: [
        "core no debe importar vscode, React ni clientes HTTP concretos.",
        "deepseekApi contiene protocolo DeepSeek, streaming, modelos y requests de tool calls.",
        "vscodeApi contiene activación, comandos, webviews, workspace, archivos y terminal.",
        "ui contiene la webview React y comunica solo mediante el contrato compartido.",
        "web-doc usa Astro y debe soportar inglés, español y chino.",
        "Las carpetas de código fuente usan camelCase y los archivos de implementación usan PascalCase.",
        "Tooling, salida generada, archivos de routing y barrels mantienen los nombres requeridos por su ecosistema, como package.json, index.ts y rutas Astro.",
      ],
    },
  ],
};
