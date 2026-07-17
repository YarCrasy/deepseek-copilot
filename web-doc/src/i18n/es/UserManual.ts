import type { PageContent } from "../Types";

export const userManual: PageContent = {
  navTitle: "Manual",
  title: "Manual de usuario",
  description: "Configura y usa el chat, las herramientas, los permisos, el contexto y el historial del workspace.",
  lead: "Configura la API key, elige un modo de permisos y usa DeepSeek desde la barra lateral con control explícito sobre cada operación del workspace.",
  sections: [
    {
      title: "Primeros pasos",
      items: [
        "Abre Yar's DeepSeek Copilot desde la Activity Bar e introduce la API key en Settings. La clave se guarda en VS Code Secret Storage.",
        "Elige el modelo, thinking mode, reasoning effort, límite de respuesta y máximo de rondas de herramientas.",
        "Escribe ./ o ../ para autocompletar rutas del workspace, o usa los menús contextuales del explorador y del editor para adjuntar archivos y selecciones exactas.",
        "Usa Stop generation para cancelar la petición y cualquier árbol de procesos de terminal activo. El prompt cancelado vuelve al input y no se guarda como un turno completado.",
      ],
    },
    {
      title: "Permisos y estados de herramientas",
      items: [
        "chat no expone herramientas; read-only permite read_file, list_directory y search_content; workspace añade creación y edición de archivos; full-access añade la ejecución de terminal.",
        "Cada herramienta puede deshabilitarse, requerir aprobación manual o usar aprobación automática. Las operaciones peligrosas siempre solicitan una confirmación adicional.",
        "Las tool calls pasan por awaiting confirmation, running y un único estado final: completed, rejected, cancelled o error.",
        "El host de la extensión confirma las acciones de ejecutar y rechazar antes de que la webview fije el estado visible.",
        "Las tool calls de una ronda se ejecutan secuencialmente. Las llamadas idénticas repetidas se omiten y el límite configurable de rondas detiene los bucles.",
      ],
    },
    {
      title: "Ejecución de terminal",
      items: [
        "Los comandos de terminal son no interactivos: no pueden responder a prompts ni disponer de una TTY.",
        "El resultado registra stdout, stderr, código de salida, señal, timeout, cancelación, directorio efectivo y shell.",
        "La salida está limitada; si se trunca, se conservan el principio y el final y se marca la parte central omitida.",
        "Los comandos desconocidos requieren precaución. Se revisan las cadenas de Bash, PowerShell y cmd, publicaciones, despliegues, cambios remotos, gestores de paquetes, redirecciones y operaciones destructivas.",
      ],
    },
    {
      title: "Historial y privacidad",
      items: [
        "Los ajustes se guardan en ~/.yrs-dpsk-copilot/settings.json. La API key permanece en Secret Storage de VS Code.",
        "El historial se guarda globalmente como un archivo JSON por conversación en ~/.yrs-dpsk-copilot/history/ y cada entrada muestra su workspace de origen.",
        "Puede deshabilitarse y su retención puede configurarse entre 0 días (solo borrado manual) y 3650 días. El valor predeterminado es 30 días.",
        "La lista se reconstruye directamente desde archivos de conversación validados. El almacenamiento está limitado a 100 conversaciones y 24 MiB.",
        "Borrar una conversación o todas las visibles usa una confirmación nativa de VS Code y ofrece Deshacer. Borrar la conversación activa también limpia Chat view.",
        "Las herramientas pending o running interrumpidas se restauran como cancelled. Los registros corruptos se aíslan en el directorio history/corrupt.",
      ],
    },
    {
      title: "Contexto y comandos slash",
      items: [
        "Auto context incluye el editor activo y los cambios staged y unstaged de Git con límites de tiempo y tamaño.",
        "Los archivos referenciados y las instrucciones AGENTS.md tienen límites de tamaño, usan etiquetas relativas al workspace y se delimitan como datos no confiables.",
        "El contexto de conversación se recorta a un presupuesto acotado; los resultados grandes, el razonamiento y los archivos se acortan por el centro.",
        "Usa /context para inspeccionar qué enviaría una petición normal. También están disponibles /status, /tools, /mode, /auto-context, /review, /goal, /summarize y /clear-context.",
      ],
    },
  ],
};
