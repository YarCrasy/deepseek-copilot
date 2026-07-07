import { deepseekFetch, buildModelsUrl } from "./utils";

// ── Interfaz de modelo desde la API ──
export interface DeepSeekModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

// ── Listar modelos disponibles ──
export async function listModels(apiKey: string, baseUrl: string): Promise<DeepSeekModel[]> {
  const url = buildModelsUrl(baseUrl);
  const response = await deepseekFetch({ pathOrUrl: url, apiKey, baseUrl });
  const data = await response.json();
  return data.data || [];
}

// ── Obtener información de un modelo específico ──
export async function getModel(modelId: string, apiKey: string, baseUrl: string): Promise<DeepSeekModel | null> {
  const url = `${buildModelsUrl(baseUrl)}/${modelId}`;
  try {
    const response = await deepseekFetch({ pathOrUrl: url, apiKey, baseUrl });
    const data = await response.json();
    return data.data || null;
  } catch {
    return null;
  }
}
