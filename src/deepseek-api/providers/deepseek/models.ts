import { deepseekFetch } from "@/deepseek-api/client/deepseekFetch";
import { buildModelsUrl } from "@/deepseek-api/endpoints/deepseekEndpoints";

export interface DeepSeekModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export async function listModels(apiKey: string, baseUrl: string): Promise<DeepSeekModel[]> {
  const url = buildModelsUrl(baseUrl);
  const response = await deepseekFetch({ pathOrUrl: url, apiKey, baseUrl });
  const data = await response.json();
  return data.data || [];
}

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
