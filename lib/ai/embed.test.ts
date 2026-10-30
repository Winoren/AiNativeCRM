/**
 * O que este teste protege, em duas frentes.
 *
 * **1. GLM usa provider OpenAI-compatible explícito.** Passar uma string com
 * barra para o AI SDK desviaria a chamada para o gateway da Vercel; o teste
 * protege o objeto de provider e o parâmetro `dimensions: 1024` da Zhipu.
 *
 * A asserção é sobre o TIPO do que chega em `embed({model})`: string significa
 * "deixa o gateway resolver"; objeto significa "provider explícito". É a única
 * diferença observável sem rede.
 *
 * **2. A chave vem da instalação.** Os casos abaixo cobrem os dois desfechos — a chave GLM é usada,
 * e a ausência dela vira erro TIPADO em vez de
 * uma falha genérica que a tela não sabe traduzir.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const embedSpy = vi.fn();
vi.mock("ai", () => ({
  embed: (args: unknown) => embedSpy(args),
}));

let chaveMock: () => unknown;
vi.mock("@/lib/ai/embeddings/chave", async () => {
  const real = await vi.importActual<typeof import("@/lib/ai/embeddings/chave")>(
    "@/lib/ai/embeddings/chave",
  );
  return {
    ...real,
    // Mockado porque a resposta REAL depende de banco e de `.env.local`, e este
    // arquivo mede qual OBJETO DE MODELO chega em `embed()`. Sem isto ele só
    // passaria em máquina com credencial — refém de algo que não usa.
    resolverChaveDeEmbedding: async () => chaveMock(),
  };
});

import { embedText, SemChaveDeEmbeddingError } from "@/lib/ai/embed";

beforeEach(() => {
  embedSpy.mockReset();
  embedSpy.mockResolvedValue({
    // 1024 dimensões: `embedText` assere a dimensão a cada chamada, porque
    // divergir de modelo quebra o recall em SILÊNCIO.
    embedding: Array.from({ length: 1024 }, (_, i) => i / 1024),
    usage: { tokens: 7 },
  });
  chaveMock = () => ({
    apiKey: "glm-da-instalacao",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    viaGateway: false,
    origem: "chave_da_instalacao",
    rotulo: "GLM Embedding 3",
    avisos: [],
  });
});

describe("embedText", () => {
  it("usa provider OpenAI-compatible explícito e pede 1024 dimensões", async () => {
    await embedText("oi", { organizationId: "org-1" });

    const arg = embedSpy.mock.calls[0]?.[0] as {
      model: unknown;
      providerOptions?: { openai?: { dimensions?: number } };
    };
    // String aqui = o gateway resolve = plano anônimo = teto. É o defeito.
    expect(
      typeof arg.model,
      "modelo chegou como string: o gateway vai resolver e cair no plano anônimo",
    ).not.toBe("string");
    expect(arg.model).toBeTypeOf("object");
    expect(arg.providerOptions?.openai?.dimensions).toBe(1024);
  });

  it("devolve a contagem de tokens que o SDK reporta", async () => {
    const r = await embedText("oi", { organizationId: "org-1" });
    expect(r.embedding).toHaveLength(1024);
    expect(r.promptTokens).toBe(7);
  });

  it("organização SEM chave nenhuma vira erro tipado, não uma falha genérica", async () => {
    chaveMock = () => null;

    await expect(embedText("oi", { organizationId: "org-1" })).rejects.toBeInstanceOf(
      SemChaveDeEmbeddingError,
    );
    // E não chega a chamar o SDK: falhar depois de gastar a chamada seria pior.
    expect(embedSpy).not.toHaveBeenCalled();
  });

  it("chave já resolvida NÃO é re-resolvida — indexar 200 trechos decifra a credencial uma vez", async () => {
    let resolucoes = 0;
    chaveMock = () => {
      resolucoes++;
      return {
        apiKey: "sk-x",
        baseUrl: null,
        viaGateway: false,
        origem: "chave_da_instalacao",
        rotulo: "x",
        avisos: [],
      };
    };

    const chave = {
      apiKey: "sk-x",
      baseUrl: null,
      viaGateway: false,
      origem: "chave_da_instalacao" as const,
      rotulo: "x",
      avisos: [],
    };
    await embedText("a", { organizationId: "org-1", chave });
    await embedText("b", { organizationId: "org-1", chave });

    expect(resolucoes, "a chave passada por parâmetro foi ignorada e re-resolvida").toBe(0);
    expect(embedSpy).toHaveBeenCalledTimes(2);
  });

  it("dimensão diferente do contrato é ERRO — recall quebrado em silêncio é pior", async () => {
    embedSpy.mockResolvedValue({ embedding: [0.1, 0.2], usage: { tokens: 1 } });

    await expect(embedText("oi", { organizationId: "org-1" })).rejects.toThrow(/1024/);
  });
});
