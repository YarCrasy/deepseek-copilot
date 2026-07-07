import type { AppConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from "@/adapters";

// ════════════════════════════════════════════════════════════════════
// Clase abstracta BaseProvider
// ════════════════════════════════════════════════════════════════════

export abstract class BaseProvider {
  public abstract readonly name: string;
  public abstract readonly id: string;

  constructor(protected config: AppConfig) {}

  /**
   * Chat Completion (sin streaming)
   */
  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /**
   * Chat Completion (con streaming vía callbacks)
   */
  abstract chatCompletionStream(request: ChatCompletionRequest, onChunk: (chunk: StreamChunk) => void, signal?: AbortSignal): Promise<void>;

  /**
   * Test de conexión con la API
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Listar modelos disponibles
   */
  abstract listModels(): Promise<Array<{ id: string; name: string }>>;

  /**
   * Actualizar configuración del provider
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
