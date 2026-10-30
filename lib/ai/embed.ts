/**
 * Embedding do RAG — indexação e busca, o mesmo modelo dos dois lados.
 *
 * A instalação usa GLM `embedding-3` pelo endpoint OpenAI-compatible da Zhipu.
 * O contrato fixa 1024 dimensões para que indexação e consulta sejam sempre
 * comparáveis.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

import {
  DIMENSOES_DO_EMBEDDING,
  MODELO_DE_EMBEDDING,
  resolverChaveDeEmbedding,
  type ChaveDeEmbedding,
  type PontoDeEmbedding,
} from "@/lib/ai/embeddings/chave";
import type { ModelId } from "@/lib/ai/gateway";

export interface EmbedOptions {
  organizationId: string;
  /**
   * Qual ponto de IA está chamando. Muda apenas de QUAL binding a chave sai —
   * o modelo é o mesmo por contrato, e divergir quebraria o recall em silêncio.
   */
  ponto?: PontoDeEmbedding;
  /**
   * Chave já resolvida. Existe para o indexador resolver UMA vez e embedar N
   * chunks: sem isto, indexar um documento de 200 trechos decifraria a
   * credencial 200 vezes.
   */
  chave?: ChaveDeEmbedding;
  model?: ModelId;
}

export interface EmbedResult {
  embedding: number[];
  promptTokens: number;
  model: string;
}

/** Falta de chave é um ESTADO do tenant, não um acidente: tipo próprio para quem
 *  chama poder mostrar a tela certa em vez de repetir um erro genérico. */
export class SemChaveDeEmbeddingError extends Error {
  readonly code = "embedding_sem_chave";
  constructor(readonly organizationId: string) {
    super(
      "Esta instalação não tem chave GLM para indexar nem consultar o material. " +
        "Defina GLM_API_KEY no .env.local.",
    );
    this.name = "SemChaveDeEmbeddingError";
  }
}

export async function embedText(content: string, opts: EmbedOptions): Promise<EmbedResult> {
  const chave = opts.chave ?? (await resolverChaveDeEmbedding(opts.organizationId, opts.ponto));
  if (!chave) {
    throw new SemChaveDeEmbeddingError(opts.organizationId);
  }

  const modelId = String(opts.model ?? MODELO_DE_EMBEDDING);

  const resolvido = createOpenAI({
    apiKey: chave.apiKey ?? "",
    ...(chave.baseUrl ? { baseURL: chave.baseUrl } : {}),
  }).textEmbeddingModel(modelId.replace(/^zhipu\//, ""));

  const result = await embed({
    model: resolvido,
    value: content,
    providerOptions: {
      openai: { dimensions: DIMENSOES_DO_EMBEDDING },
    },
  });

  // Dimensão asserida a cada chamada: divergir de modelo quebra o recall em
  // SILÊNCIO (os vetores deixam de ser comparáveis), e uma chamada recusada é
  // infinitamente melhor que um acervo que responde errado com nota alta.
  if (result.embedding.length !== DIMENSOES_DO_EMBEDDING) {
    throw new Error(
      `embedding com ${result.embedding.length} dimensões, esperado ${DIMENSOES_DO_EMBEDDING} ` +
        `(pin de contrato ${modelId}) — recall quebraria em silêncio`,
    );
  }

  // EmbedResult.embedding is `number[]` for single-value embed.
  const promptTokens =
    (result.usage as { tokens?: number; promptTokens?: number } | undefined)?.tokens ??
    (result.usage as { tokens?: number; promptTokens?: number } | undefined)?.promptTokens ??
    0;

  return { embedding: result.embedding, promptTokens, model: modelId };
}
