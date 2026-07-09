import type { PageContent } from "../Types";

export const changelog: PageContent = {
  navTitle: "Changelog",
  title: "Changelog",
  description: "Cambios relevantes y estado preview.",
  lead: "Esta página resume los cambios visibles para la primera preview del Marketplace.",
  sections: [
    {
      title: "0.1.0 preview",
      items: [
        "Migración de la extensión a la arquitectura por capas bajo src.",
        "Eliminación de Ollama y del selector de proveedores en la superficie del producto.",
        "Añadido chat React webview, History, Settings y configuración de tools.",
        "Añadido autocompletado de rutas en el input con iconos estilo VS Code.",
        "Mejorada la cancelación: el prompt cancelado vuelve al input y no queda en el contexto.",
        "Añadidas tooltips globales del webview usando variables de tema de VS Code.",
        "Preparados metadatos de Marketplace, licencia MIT, README, empaquetado VSIX y documentación.",
        "Adoptada la identidad única yarcrasy.yrs-dpsk-copilot y el nombre descriptivo Yar's Deepseek copilot - A VS Code copilot specialized on Deepseek.",
      ],
    },
  ],
};
