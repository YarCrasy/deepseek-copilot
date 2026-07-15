# Auditoría de mejoras pendientes

Fecha de revisión: 15 de julio de 2026.

Este documento recoge una revisión estática del proyecto completo, centrada especialmente en los problemas observados durante el desarrollo del flujo `think -> tool -> think -> response`. No se ha modificado código funcional durante esta auditoría.

## Resumen ejecutivo

Las mejoras con más impacto son:

1. Sustituir los marcadores `<<<YDSC_TOOL_ROUND:n>>>` incrustados en texto por un historial tipado de eventos cronológicos.
2. Hacer que la cancelación abarque también los procesos de terminal y que todos los estados terminales sean coherentes (`completed`, `rejected`, `error`, `cancelled`).
3. Corregir el aislamiento del workspace ante enlaces simbólicos y validar de verdad los mensajes procedentes del webview.
4. Corregir el runner de tests y añadir pruebas de integración del ciclo de tools, streaming, permisos e historial.
5. Separar el historial por workspace, limitar su tamaño y definir una versión de esquema.

## P0 — Bloqueantes antes de publicar (completado)

### 1. Historial cronológico basado en eventos, no en texto

**Estado: implementado.** El host y el webview comparten ahora eventos nativos `reasoning`, `content` y `tool-group`; se eliminó el protocolo de marcadores y el almacenamiento anterior quedó aislado mediante una nueva clave de historial.

**Problema:** `ToolCallSession` inserta marcadores privados dentro de `content` y `reasoning`, y `ChatMessages` vuelve a parsearlos con expresiones regulares. Esto mezcla datos de control y contenido visible, permite que los marcadores se filtren al chat y hace frágil el orden durante streaming, cancelaciones y restauraciones.

**Propuesta:** persistir una secuencia explícita, por ejemplo:

```ts
type AssistantTimelineEvent =
  | { type: "reasoning"; id: string; text: string; status: "streaming" | "complete" }
  | { type: "content"; id: string; text: string; status: "streaming" | "complete" }
  | { type: "tool-group"; id: string; round: number; toolCallIds: string[] };
```

La UI debe renderizar esa secuencia en su orden original. El contenido enviado de nuevo a DeepSeek puede derivarse del historial, pero no debe usarse como almacenamiento de la presentación.

**Criterios de aceptación:**

- Se representa correctamente `think -> tool -> think -> response`.
- Dos bloques de razonamiento consecutivos permanecen separados si pertenecen a turnos o fases distintas.
- Una tool call nunca cambia de posición porque el bloque anterior siga recibiendo chunks.
- No aparecen marcadores internos al recargar, cancelar o reabrir VS Code.

### 2. Cancelación real de comandos

**Estado: implementado.** La señal de cancelación llega hasta el handler, `spawn` sustituye a `exec` y se termina el árbol completo mediante grupos de procesos en Unix o `taskkill /T /F` en Windows. Timeout y cancelación quedan diferenciados.

**Problema:** el `AbortSignal` detiene la petición/modelo, pero `child_process.exec` no recibe esa señal. Un comando puede continuar ejecutándose después de pulsar detener, superar el ciclo de chat o dejar procesos hijos en Windows.

**Propuesta:** ejecutar mediante `spawn` o `execFile` con gestión explícita del proceso, conectar el `AbortSignal`, matar el árbol de procesos cuando corresponda y distinguir timeout, cancelación y error de salida.

### 3. Evitar escapes mediante enlaces simbólicos

**Estado: implementado.** Las operaciones resuelven el `realpath` del workspace y del ancestro existente más cercano antes de acceder. Los destinos que atraviesan symlinks o junctions externos se rechazan, incluido el `cwd` de terminal.

**Problema:** `resolveWorkspacePath` comprueba rutas lexicalmente con `path.resolve`/`path.relative`, pero una ruta aparentemente interna puede atravesar un symlink/junction que apunte fuera del workspace.

**Propuesta:** comprobar el `realpath` del root y de los destinos existentes; al crear archivos, comprobar el `realpath` del ancestro existente más cercano. Añadir casos de prueba para symlinks y junctions en Windows.

### 4. Validación completa de mensajes del webview

**Estado: implementado.** Los mensajes se validan mediante una unión discriminada con campos, enums, URLs, límites y propiedades permitidas por operación. También se validan el historial persistido y las respuestas completas/deltas de tools del proveedor.

**Problema:** `isWebviewToHandlerMessage` solo valida que `type` pertenezca a una lista. Después se confían campos como comandos, rutas, configuración, código, IDs y credenciales según el tipo declarado.

**Propuesta:** usar validadores discriminados por mensaje, con límites de longitud, tipos, enums y rechazo de propiedades inesperadas. Aplicar el mismo principio a respuestas persistidas y datos recibidos de la API.

### 5. Reparar el runner unitario

**Estado: implementado.** El runner usa rutas absolutas, descubre automáticamente todos los `*.test.ts`, genera ESM nativo y ejecuta actualmente toda la suite.

**Problema confirmado:** `npm.cmd run test:unit` no ejecuta las pruebas. Esbuild 0.28 no resuelve entradas como `src/test/ApplyPatch.test.ts` sin un prefijo o ruta absoluta y además intenta inspeccionar una ruta superior sin permisos.

**Propuesta:** generar las entradas con `resolve(...)`, descubrir automáticamente `src/test/**/*.test.ts` y hacer que cualquier test nuevo se incluya sin editar manualmente el runner.

### 6. Corregir la clave de configuración de instrucciones globales

**Estado: implementado.** La clave relativa usa ahora `projectInstructions.includeHomeAgents` y una prueba comprueba que coincide exactamente con la contribución de `package.json`.

**Problema probable:** `INCLUDE_HOME_AGENTS_KEY` vale `ProjectInstructions.includeHomeAgents`, mientras que la contribución declarada es `yrs-dpsk-copilot.projectInstructions.includeHomeAgents`. Al leerla desde `getConfiguration("yrs-dpsk-copilot")`, la clave relativa debería conservar `projectInstructions` con `p` minúscula.

**Propuesta:** corregir la constante y añadir una prueba que active/desactive la carga de `~/.yrs-dpsk-copilot/AGENTS.md`.

## P1 — Fiabilidad y seguridad

**Estado: implementado.** El ciclo usa estados nativos y acuses del host; terminal, SSE y red devuelven contratos estructurados con cancelación y timeout; el historial está versionado por workspace con índice ligero, retención, cuota y recuperación; el contexto se poda y delimita; y las rutas, instrucciones, hashes y workspaces múltiples tienen protecciones explícitas. Las ampliaciones opcionales de producto (renombrar, fijar e importar historiales) permanecen fuera de P1.

### Ciclo de tools y estados

- Modelar estados con una máquina de estados única: `pending -> awaiting_confirmation -> running -> completed | rejected | cancelled | error`.
- No convertir un rechazo durante generación en `error`; debe conservarse como `rejected` inmediatamente y después de restaurar el historial.
- Diferenciar cancelación de toda la generación y rechazo de una tool individual.
- Esperar el acuse del extension host antes de aplicar definitivamente acciones optimistas del webview, o reconciliarlas si el host las rechaza.
- Persistir o invalidar explícitamente tool calls pendientes al cerrar/reabrir el host. Al restaurar, ninguna debe quedar eternamente en `pending` o `running`.
- Evitar que todas las tool calls manuales de una ronda bloqueen el ciclo hasta recibir todas las decisiones. Resolverlas de manera secuencial o permitir ejecutar las ya aprobadas cuando no tengan dependencias.
- No omitir confirmación manual de `edit_file` y `apply_patch` mediante una excepción fija; la política debe proceder del modo de permisos y de una decisión explícita del usuario.
- Hacer la confianza de sesión específica de la operación o de una política concreta. La clave actual `toolName:dangerLevel` hace que aprobar un comando pueda confiar otros comandos diferentes del mismo nivel.
- Al alcanzar `maxRounds`, crear una terminación clara y persistible; no devolver silenciosamente un mensaje con tool calls sin resolver.
- Añadir detección de ciclos: misma tool con los mismos argumentos repetida, lecturas idénticas o verificaciones redundantes.
- Hacer que la regla de “no verificar innecesariamente” sea también una protección del orquestador, no solo una frase del system prompt.
- Decidir y documentar si las tools de una misma ronda son secuenciales o paralelas. Paralelizar solo lecturas independientes; mantener orden para escrituras.
- Normalizar IDs con `crypto.randomUUID()` para evitar colisiones entre mensajes restaurados y nuevos.

### Ejecución de terminal

- Devolver un resultado estructurado con `stdout`, `stderr`, `exitCode`, `signal`, `timedOut` y `cancelled`.
- Marcar `isError: true` cuando el proceso termina con código distinto de cero. Actualmente varios handlers devuelven texto que el executor puede considerar éxito.
- No describir la tool como “terminal interactiva” mientras use `exec`; no soporta prompts, TTY ni procesos largos interactivos.
- Permitir configurar timeout y límite de salida dentro de márgenes seguros.
- Truncar stdout/stderr con indicación explícita y conservar el final del error, no fallar únicamente por `maxBuffer`.
- Mostrar el directorio efectivo y el shell usado antes de confirmar.
- Analizar comandos por shell/plataforma. Las regex actuales están centradas en Unix y se pueden eludir con PowerShell, `cmd`, aliases, quoting, variables, comandos codificados o separadores.
- Considerar todos los comandos desconocidos como mínimo `caution`, no `safe` por defecto.
- Revisar la lista de comandos “seguros”: `find`, `tee` y otros pueden escribir, ejecutar acciones o producir efectos según sus argumentos.
- Evaluar cada segmento encadenado (`|`, `&&`, `||`, `;`, redirecciones y subprocesos), no solo el primer comando.
- Añadir protección específica para publicación, despliegue, cambios remotos, gestores de paquetes, credenciales y comandos destructivos de Windows.

### Rutas, archivos y workspaces

- Soportar workspaces multi-root. La implementación usa casi siempre `workspaceFolders[0]`.
- Asociar cada conversación al workspace y root concretos utilizados por sus tools.
- Separar la política de lectura sensible de la de escritura. Bloquear por nombre cualquier archivo que contenga `token` o `credential` puede impedir editar código legítimo, mientras que otros secretos con nombres distintos pasan inadvertidos.
- Detectar archivos binarios antes de decodificarlos como UTF-8.
- Establecer límites totales de archivos referenciados, no solo un máximo por archivo.
- Incluir rangos exactos en referencias de selecciones.
- Delimitar contenido de archivos e instrucciones de proyecto para reducir prompt injection y evitar que secuencias de triple backtick rompan el formato.
- Limitar el tamaño de cada `AGENTS.md` y el total combinado.
- Evitar incluir rutas absolutas del equipo en el prompt; usar etiquetas relativas o de ámbito.
- Añadir hashes/conflictos optimistas también a creación y otras escrituras donde sean útiles.
- Revisar cambios en disco inmediatamente antes de aplicar un diff confirmado.

### API y streaming

- Implementar timeout en `fetch` para chat y prueba de conexión.
- Cancelar el reader SSE y cerrar la conexión al abortar.
- Procesar SSE conforme al formato: `data:` con o sin espacio, eventos multilínea, comentarios y finalización del decoder.
- No ignorar JSON malformado silenciosamente; registrar un error diagnóstico saneado.
- Añadir reintentos acotados para 429/5xx y errores transitorios, respetando `Retry-After` y nunca repitiendo automáticamente una operación con efectos locales.
- Validar `baseUrl` como URL HTTPS por defecto; mostrar advertencia explícita para HTTP y hosts personalizados.
- Evitar concatenar `baseUrl + "/chat/completions"` sin normalizar barras/ruta.
- Validar rangos de `temperature`, `topP` y `maxTokens` tanto en UI como en el host.
- Gestionar respuestas sin `choices`, finish reasons desconocidos y usage parcial.
- No usar un typewriter fijo de 2 caracteres cada 12 ms. Produce retraso acumulativo y colas grandes.
- En `streamDone`, drenar o aplicar de inmediato todos los chunks pendientes antes de marcar la generación como terminada y guardar.
- Aplicar backpressure o agrupar actualizaciones de React por frame para evitar un render por pocos caracteres.
- Garantizar que el usuario no pueda iniciar otro turno mientras el anterior aún tenga una cola visual pendiente.

### Historial y privacidad

- Guardar conversaciones por workspace (`workspaceState` o almacenamiento indexado por URI), no todas juntas en `globalState`.
- Definir `schemaVersion` y migraciones explícitas. Al no estar en producción se puede reemplazar ya el formato sin capa de compatibilidad compleja.
- No normalizar silenciosamente datos corruptos; detectar, aislar y permitir recuperar/exportar.
- Limitar número/tamaño total de conversaciones y avisar cuando se alcance la cuota de VS Code.
- Evitar reescribir y ordenar toda la colección en cada guardado.
- Mantener un índice ligero para la lista y cargar el cuerpo solo al abrir una conversación.
- Implementar borrado masivo en una sola operación; el “borrar todo” actual dispara N borrados y N recargas.
- Pedir confirmación antes de borrar una conversación o todo el historial, con opción de deshacer.
- Añadir renombrado, fijado, exportación/importación y búsqueda por contenido si se desea conservar historiales largos.
- Permitir desactivar el historial o configurar retención por privacidad.
- No reenviar indefinidamente razonamientos, resultados completos y contenidos de archivos a la API; aplicar presupuesto de contexto, resumen y poda.
- Mostrar qué contexto, archivos e instrucciones se enviarán antes de la petición cuando el usuario lo solicite.
- Incluir cambios staged además de unstaged en el contexto Git automático.
- Añadir timeout a los comandos Git de revisión y evitar truncar bytes en mitad de un carácter UTF-8.

## P2 — UI, accesibilidad y experiencia de uso

### Chat

- Renderizar la cronología desde el modelo de eventos, con claves estables, sin inferir rondas ausentes.
- Mantener separados razonamiento, texto y tool calls en vivo y al restaurar.
- Mostrar estado textual además del color para todos los estados.
- Indicar claramente qué permisos impiden una operación antes de llamar al modelo, y no ofrecer botones de ejecución para tools no disponibles.
- Si el modo es `read-only`, comunicar al modelo que no proponga ni intente tools de escritura; la UI y el host siguen siendo la autoridad final.
- Añadir botón para saltar al bloque en ejecución y controlar el autoscroll cuando el usuario está leyendo contenido anterior.
- Permitir copiar una tool call, sus argumentos y su resultado de forma separada.
- Añadir duración, código de salida y salida truncada a cada ejecución.
- Permitir redactar el siguiente mensaje mientras se genera, aunque el envío permanezca deshabilitado.
- Deshabilitar realmente Enter cuando `canSend` sea falso; `handleSend` comprueba menos condiciones que el botón.
- Debouncear el autocompletado de rutas y evitar peticiones duplicadas en `change`, `keyup` y `click`.
- Añadir navegación completa por teclado y anuncios `aria-live` para sugerencias, streaming y cambios de estado.
- Internacionalizar textos; actualmente se mezclan español e inglés.
- Renombrar “Think process” a una etiqueta consistente y configurable, por ejemplo “Razonamiento”.
- Ofrecer una opción de ocultar razonamiento por defecto y recordar el estado de los desplegables.
- Evitar mostrar razonamiento interno sin una explicación de privacidad y disponibilidad del proveedor.

### Diálogos y confirmaciones

- Implementar focus trap, foco inicial, Escape, restauración del foco y `aria-labelledby`/`aria-describedby` en confirmaciones.
- No cerrar accidentalmente una confirmación peligrosa al hacer clic fuera.
- Mostrar el diff o comando completo con scroll, resaltado y posibilidad de abrirlo en editor.
- Separar “ejecutar una vez” de “confiar durante la sesión” y explicar el alcance exacto de la confianza.
- Pedir confirmación adicional para operaciones destructivas aunque una tool esté en auto-approve.

### Ajustes e historial

- No guardar/normalizar configuración automáticamente solo por abrir Ajustes.
- Confirmar “Reset to Defaults” y refrescar también el estado de API key tras el reset.
- Mostrar mensajes de éxito además de errores y evitar notificaciones que desaparezcan antes de ser leídas.
- Validar todos los selects y números sin casts inseguros desde `string`/`unknown`.
- Explicar en el selector de permisos qué tools concretas quedan habilitadas.
- Permitir ajustar permisos por workspace en lugar de únicamente a nivel de aplicación.
- Virtualizar o paginar historiales largos y buscar sin enviar todos los cuerpos al webview.
- Añadir estados vacíos, de carga y error recuperable a historial y ajustes.

## P2 — Arquitectura y mantenibilidad

- Centralizar el estado de conversación en un reducer/store con eventos; ahora se reparte entre host, varios hooks, refs, mensajes y texto parseado.
- Definir un protocolo versionado host-webview y generar sus tipos/validadores desde una fuente común.
- Separar mensajes de dominio, mensajes de transporte y modelos persistidos.
- Hacer que tool handlers devuelvan siempre un tipo resultado, nunca errores codificados como strings.
- Completar la validación JSON Schema de tools: objetos anidados, arrays, enums, límites y `additionalProperties` recursivo.
- Dividir el system prompt monolítico en secciones componibles y probar las variantes de permisos.
- Mantener la autorización en código; el prompt solo debe describir capacidades, nunca ser el control de seguridad.
- Sustituir el logger silencioso por un `OutputChannel` administrado, con niveles, redacción de secretos y modo diagnóstico opcional.
- Añadir IDs de correlación por petición, ronda y tool call.
- Manejar y esperar los `Thenable` devueltos por `webview.postMessage`; registrar fallos cuando la vista desaparezca.
- Cancelar listeners, timers y peticiones cuando el webview se destruye o cambia de instancia.
- Validar y escapar `DEEPSEEK_COPILOT_WEBVIEW_DEV_SERVER`; actualmente se interpola en HTML/CSP de desarrollo.
- Limitar los reintentos del servidor Vite y mostrar un error accionable.
- Sustituir el reemplazo regex de assets en el HTML de producción por una plantilla/manifiesto de Vite.
- Evitar duplicar configuración y valores por defecto entre `package.json`, adapters, UI y managers.
- Añadir comentarios de invariantes donde el orden de eventos y la persistencia dependan entre sí.

## P1/P2 — Pruebas y calidad

### Cobertura imprescindible

- Ciclo completo `think -> tool -> think -> response` con streaming fragmentado.
- Varias tools en una ronda y varias rondas consecutivas.
- Razonamientos consecutivos sin tool intermedia.
- Cancelación antes, durante y después de confirmar una tool.
- Rechazo individual, rechazo masivo, timeout y salida distinta de cero.
- Recarga de VS Code con tools `pending`/`running`.
- Historial restaurado con la misma cronología que la sesión en vivo.
- Cambio de permisos durante una conversación.
- Modos `chat`, `read-only`, `workspace` y `full-access`, incluyendo overrides por tool.
- Symlinks/junctions, rutas UNC, Windows drive letters, mayúsculas/minúsculas y multi-root.
- SSE con chunks partidos, `data:` sin espacio, eventos multilínea, JSON inválido y aborto.
- Límites de contexto, archivos binarios, archivos enormes y contenido con fences/markers.
- Mensajes webview malformados y payloads sobredimensionados.
- Danger analysis para Bash, PowerShell y cmd, con comandos encadenados y ofuscados.

### Infraestructura de calidad

- Incluir `.tsx` en ESLint; la configuración actual selecciona explícitamente `**/*.ts`.
- Activar reglas type-aware y elevar invariantes importantes de warning a error.
- Añadir formatter y comprobación de formato reproducible.
- Añadir cobertura y umbrales para módulos críticos.
- Añadir tests de componentes React y accesibilidad.
- Añadir CI para compile, lint, unit, integración, build y empaquetado.
- Ejecutar la integración en una matriz mínima de Windows/Linux y una versión estable de VS Code compatible.
- Añadir prueba automática del contenido del `.vsix`: extensión, webview, codicons, assets y exclusión de fuentes innecesarias.
- Añadir auditoría de dependencias, actualización automatizada y revisión de licencias.
- Añadir pruebas de carga para chats/historiales grandes y streams largos.

## P3 — Producto y documentación

- Documentar con precisión la matriz permiso × tool × confirmación × auto-approve.
- Documentar dónde se almacena el historial, qué datos se envían al proveedor y cómo borrarlos.
- Documentar limitaciones de terminal: timeout, no interactividad, shell y cancelación.
- Añadir guía de resolución de errores de API, tools bloqueadas y procesos atascados.
- Mantener README, configuración y descripciones de tools sincronizados mediante una fuente común.
- Ampliar CHANGELOG con migraciones de historial y cambios de permisos.
- Añadir guía de contribución, arquitectura, modelo de amenazas y política de seguridad.
- Añadir telemetría únicamente opt-in y agregada si se necesita medir fallos; nunca incluir prompts, rutas, comandos, respuestas ni API keys.
- Considerar selección de proveedor/modelo desacoplada si se prevé soportar más APIs en el futuro.
- Añadir indicadores de coste/tokens y tamaño de contexto antes o después de cada turno.

## Comprobaciones realizadas

- `npm.cmd run compile`: finaliza sin errores.
- `npm.cmd run lint`: finaliza sin errores visibles, con la limitación de que no cubre `.tsx` de forma explícita.
- `npm.cmd run test:unit`: 48 pruebas aprobadas, incluidas cronología, cancelación de árboles de procesos, junctions/symlinks, protocolo webview, historial y respuestas del proveedor.
- `npm.cmd run build`: extensión y webview de producción construidos correctamente.
- `npm.cmd run test:integration`: se intentó ejecutar, pero `vscode-test` quedó esperando sin producir salida y se detuvo tras 120 segundos; queda por diagnosticar dentro de la infraestructura P1/P2.

## Orden de implementación sugerido

1. Reparar tests y crear casos que reproduzcan orden, cancelación y restauración.
2. Introducir el modelo de eventos cronológicos y reemplazar marcadores.
3. Unificar la máquina de estados de tools y la cancelación de procesos.
4. Endurecer rutas, mensajes webview, danger analysis y resultados estructurados.
5. Versionar/rediseñar el historial por workspace con límites de contexto.
6. Corregir accesibilidad, rendimiento de streaming y UX de permisos.
7. Completar CI, documentación y observabilidad.

La recomendación es no seguir añadiendo excepciones visuales al renderer actual. Primero conviene fijar el contrato de datos cronológico y hacer que tanto el streaming como el historial consuman exactamente ese mismo contrato.
