import type { PageContent } from "../Types";

export const technicalDecisions: PageContent = {
  navTitle: "Decisiones técnicas",
  title: "Decisiones técnicas",
  description: "Decisiones de arquitectura, persistencia, streaming y ejecución.",
  lead: "La extensión separa el estado de dominio, el transporte de DeepSeek, las capacidades de VS Code y el renderizado React para que las reglas de seguridad sean autoritativas en el host.",
  sections: [
    {
      title: "Límites entre capas",
      items: [
        "core contiene la conversación, el contexto y el dominio de herramientas independientes del proveedor, y no importa React ni clientes HTTP concretos.",
        "deepseekApi contiene las peticiones, validación de respuestas, parsing SSE, reintentos acotados y orquestación de tool calls.",
        "vscodeApi contiene secretos, workspace, almacenamiento, comandos, procesos de terminal, confirmaciones y comunicación host-webview.",
        "ui contiene la webview React y solo cambia el estado autoritativo de una herramienta después de recibir mensajes del host.",
      ],
    },
    {
      title: "Modelo cronológico de eventos",
      items: [
        "La presentación del asistente se persiste como eventos tipados de razonamiento, contenido y grupos de herramientas, no como marcadores de control dentro de texto.",
        "El mismo contrato de timeline renderiza el stream en vivo y el historial restaurado, conservando el orden think -> tool -> think -> response.",
        "Los deltas de texto se agrupan por frame de animación y se vacían antes de los grupos de herramientas, finalización, cancelación o persistencia.",
        "Los IDs de mensajes, eventos, conversaciones y tool calls de respaldo usan crypto.randomUUID().",
      ],
    },
    {
      title: "Herramientas y terminal",
      items: [
        "El estado de herramientas tiene un único ciclo nativo que termina en completed, rejected, cancelled o error; un rechazo no se codifica como error de ejecución.",
        "Las llamadas se ejecutan secuencialmente para preservar el orden de escritura y las aprobaciones independientes; el orquestador bloquea duplicados con el mismo nombre y argumentos.",
        "El terminal usa spawn, cancelación del árbol de procesos, resultados estructurados, salida acotada por principio y final, y detección de códigos de salida distintos de cero.",
        "La autorización de rutas resuelve rutas reales y ancestros existentes para impedir escapes por symlinks o junctions. La conversación conserva el URI del workspace elegido en entornos multi-root.",
        "Las escrituras confirmadas llevan guardas SHA-256 para que una edición falle si el contenido en disco cambia después de la previsualización.",
      ],
    },
    {
      title: "API, contexto y persistencia",
      items: [
        "SSE admite comentarios, CRLF, campos data con o sin espacios, eventos multilínea, finalización del decoder, diagnósticos de JSON inválido y cancelación del reader.",
        "Las peticiones a DeepSeek normalizan URLs, usan un timeout de 60 segundos por intento y un máximo de tres intentos para fallos transitorios, respetando Retry-After.",
        "Los ajustes y el historial viven bajo ~/.yrs-dpsk-copilot/. El historial usa un archivo JSON validado por conversación y deriva la lista directamente de esos archivos.",
        "El contexto tiene presupuestos agregados, detección de binarios, datos Git staged y unstaged, fuentes AGENTS.md acotadas y delimitadores explícitos de datos no confiables.",
      ],
    },
  ],
};
