import { useCallback, useRef } from "react";
import type { ChatMessage } from "../ChatViewTypes";

/**
 * Hook que encapsula la logica de streaming de mensajes.
 *
 * Gestiona:
 * - `streamingMessageIdRef`: ID del mensaje assistant que se esta construyendo
 * - `reasoningRef`: Acumulador del razonamiento en curso
 * - `messageCounterRef`: Contador para generar IDs unicos
 *
 * Las funciones `ensureStreamingAssistantMessage` y `updateStreamingMessage`
 * reciben `setMessages` como parametro (inyeccion de dependencias) para no
 * acoplar el hook al estado concreto de MsgsHandler.
 */
export function useStreamHandler() {
  const streamingMessageIdRef = useRef<string | null>(null);
  const reasoningRef = useRef("");
  const messageCounterRef = useRef(0);

  const nextMessageId = useCallback(() => {
    messageCounterRef.current += 1;
    return `msg-${messageCounterRef.current}`;
  }, []);

  const resetStreaming = useCallback(() => {
    streamingMessageIdRef.current = null;
    reasoningRef.current = "";
  }, []);

  /**
   * Asegura que exista un mensaje assistant para hacer streaming.
   * Si no hay un streaming activo, crea un nuevo mensaje vacio con
   * el razonamiento acumulado hasta el momento.
   *
   * @param setMessages - Setter de estado de mensajes (React.Dispatch)
   * @returns El ID del mensaje de streaming activo
   */
  const ensureStreamingAssistantMessage = useCallback(
    (setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>): string => {
      if (streamingMessageIdRef.current) {
        return streamingMessageIdRef.current;
      }

      const id = nextMessageId();
      streamingMessageIdRef.current = id;

      setMessages((current) => [
        ...current,
        {
          id,
          role: "assistant",
          content: "",
          reasoning: reasoningRef.current || undefined,
        },
      ]);

      return id;
    },
    [nextMessageId],
  );

  /**
   * Actualiza el mensaje de streaming activo aplicando un updater.
   * Si no hay streaming activo, crea uno nuevo.
   *
   * @param updater - Funcion que transforma el mensaje actual
   * @param setMessages - Setter de estado de mensajes
   */
  const updateStreamingMessage = useCallback(
    (updater: (message: ChatMessage) => ChatMessage, setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
      const id = ensureStreamingAssistantMessage(setMessages);
      setMessages((current) => current.map((message) => (message.id === id ? updater(message) : message)));
    },
    [ensureStreamingAssistantMessage],
  );

  return {
    /** Ref con el ID del mensaje assistant en streaming (o null si no hay) */
    streamingMessageIdRef,
    /** Ref con el razonamiento acumulado durante el streaming actual */
    reasoningRef,
    /** Genera un ID unico para el proximo mensaje (formato: "msg-N") */
    nextMessageId,
    /** Crea un mensaje assistant vacio si no hay streaming activo (retorna su ID) */
    ensureStreamingAssistantMessage,
    /** Aplica un updater al mensaje de streaming activo */
    updateStreamingMessage,
    /** Resetea los refs de streaming (streamingMessageIdRef + reasoningRef a null/vacio) */
    resetStreaming,
  };
}
