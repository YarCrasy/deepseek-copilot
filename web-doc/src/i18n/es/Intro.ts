import type { PageContent } from "../Types";

export const intro: PageContent = {
  navTitle: "Introducción",
  title: "Introducción",
  description: "Introducción a Yar's DeepSeek Copilot.",
  lead: "Yar's DeepSeek Copilot es DeepSeek-only por diseño. Ofrece un asistente enfocado dentro de VS Code sin selector de proveedores.",
  sections: [
    {
      title: "Alcance beta actual",
      items: [
        "Chat lateral con respuestas en streaming.",
        "Thinking mode puede activarse o desactivarse sin desactivar tools.",
        "Las tools pueden leer archivos, listar directorios, buscar contenido, crear archivos y ejecutar comandos de terminal.",
        "El autocompletado de rutas aparece en el input al escribir ./ o ../.",
        "Las tool calls pendientes se conservan al cambiar entre Chat, History y Settings.",
      ],
    },
    {
      title: "No afiliación",
      items: [
        "Esta es una extensión independiente de tercero. No pertenece a DeepSeek, ni está patrocinada, avalada o mantenida oficialmente por DeepSeek.",
      ],
    },
  ],
};
