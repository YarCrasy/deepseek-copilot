import type { PageContent } from "../types";

export const userManual: PageContent = {
  navTitle: "Manual",
  title: "Manual de usuario",
  description: "Cómo configurar y usar DeepSeek Copilot.",
  lead: "El flujo básico es configurar la API key, elegir modelo y preguntar desde el sidebar.",
  sections: [
    {
      title: "Flujo diario",
      items: [
        "Abre el item de DeepSeek Copilot en la Activity Bar.",
        "Configura la API key en Settings. La key se guarda en VS Code Secret Storage.",
        "Elige modelo, thinking mode, reasoning effort y modo de ejecución de tools.",
        "Escribe ./ o ../ en el input para autocompletar rutas del workspace.",
        "Revisa las tool calls pendientes antes de ejecutarlas salvo que una tool esté en auto approval seguro.",
        "Usa Stop generation para cancelar. El prompt cancelado vuelve al input y no queda en historial.",
      ],
    },
  ],
};
