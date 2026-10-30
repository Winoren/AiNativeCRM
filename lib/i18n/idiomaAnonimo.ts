import { cookies, headers } from "next/headers";

import { normalizarIdioma, IDIOMA_VISITANTE_COOKIE, parseAcceptLanguage, type Idioma } from "@/lib/i18n/idiomas";

/**
 * O idioma de quem ainda não tem sessão (ou cujo perfil não tem `locale`
 * salvo) — as telas públicas (login, signup, convite, legal) ficam fora de
 * `app/app/layout.tsx`: sem `IdiomaProvider`, sem membership, sem
 * organização de quem consultar.
 *
 * Cadeia: preferência salva → cookie do seletor anônimo →
 * `Accept-Language` do navegador → padrão. O header é só um SINAL de
 * primeira visita, nunca sobrepõe uma preferência já salva — inclusive um
 * valor antigo desconhecido nela (esse caso já degrada pro padrão dentro
 * de `normalizarIdioma`, e é um problema diferente do que este arquivo
 * resolve: visitante que NUNCA teve conta).
 *
 * O cookie (`IDIOMA_VISITANTE_COOKIE`, 1 ano, escrito no servidor pela action
 * `salvarIdiomaDoVisitante`, acionada pelo `SeletorDeIdiomaAnonimo` na tela)
 * existe porque quem não lê o idioma em que a tela de cadastro abriu não tem
 * como navegar até o perfil para consertar: a troca tem de estar na própria
 * tela pública.
 *
 * Server-only de propósito (`next/headers`): `lib/i18n/idiomas.ts` continua
 * puro porque componente cliente (`SeletorDeIdioma.tsx`) o importa.
 */

/** Cookie escrito pelo `SeletorDeIdiomaAnonimo.tsx`; constante em `idiomas.ts`. */

export async function idiomaDoVisitante(
  localeBruto: string | null | undefined,
): Promise<Idioma> {
  if (localeBruto) return normalizarIdioma(localeBruto);
  const jar = await cookies();
  const doCookie = jar.get(IDIOMA_VISITANTE_COOKIE)?.value;
  if (doCookie) return normalizarIdioma(doCookie);
  const hdrs = await headers();
  return normalizarIdioma(parseAcceptLanguage(hdrs.get("accept-language")));
}
