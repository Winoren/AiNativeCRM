/**
 * Credencial do embedding GLM usado pelo RAG.
 *
 * Indexação e consulta precisam compartilhar modelo e dimensão. A troca para
 * GLM é, por isso, um contrato único da instalação: `embedding-3`, 1024 dims,
 * sempre servido pelo endpoint OpenAI-compatible da Zhipu.
 */
import { env } from "@/lib/env";

export type PontoDeEmbedding = "embedding_indexar" | "embedding_consultar";

export const MODELO_DE_EMBEDDING = "zhipu/embedding-3";
export const DIMENSOES_DO_EMBEDDING = 1024;
export const GLM_EMBEDDING_BASE_URL_PADRAO = "https://open.bigmodel.cn/api/paas/v4";

export type OrigemDaChave = "chave_da_instalacao";

export const EXPLICACAO_DA_ORIGEM: Record<OrigemDaChave, string> = {
  chave_da_instalacao: "Usando a chave GLM configurada nesta instalação.",
};

export interface ChaveDeEmbedding {
  /** Plaintext. Vive só no processo e nunca deve ser logada ou persistida. */
  apiKey: string | null;
  baseUrl: string | null;
  /** Mantido no contrato para os chamadores; GLM é sempre acesso direto. */
  viaGateway: boolean;
  origem: OrigemDaChave;
  rotulo: string | null;
  avisos: string[];
}

/**
 * Resolve a chave fixa da instalação. `organizationId` e `ponto` continuam na
 * assinatura porque os chamadores são tenant-aware e não devem perder esse
 * contexto ao registrar o uso, embora a credencial GLM seja compartilhada.
 */
export async function resolverChaveDeEmbedding(
  organizationId: string,
  ponto: PontoDeEmbedding = "embedding_indexar",
): Promise<ChaveDeEmbedding | null> {
  void organizationId;
  void ponto;

  if (!env.GLM_API_KEY) return null;

  return {
    apiKey: env.GLM_API_KEY,
    baseUrl: env.GLM_EMBEDDING_BASE_URL || GLM_EMBEDDING_BASE_URL_PADRAO,
    viaGateway: false,
    origem: "chave_da_instalacao",
    rotulo: "GLM Embedding 3",
    avisos: [],
  };
}

export async function temChaveDeEmbedding(organizationId: string): Promise<boolean> {
  return (await resolverChaveDeEmbedding(organizationId)) !== null;
}
