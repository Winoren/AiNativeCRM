"use server";

import { cookies } from "next/headers";

import { IDIOMA_VISITANTE_COOKIE, type Idioma } from "@/lib/i18n/idiomas";

/**
 * Grava a preferência de idioma de quem ainda não tem perfil — o seletor
 * anônimo das telas públicas (`SeletorDeIdiomaAnonimo.tsx`).
 *
 * ─── Por que um cookie, e não o perfil ────────────────────────────────────
 *
 * Nas telas públicas (login, cadastro, recuperação) pode não haver usuário
 * nenhum — não existe `user_metadata.locale` onde gravar. O cookie de um ano é
 * o mesmo contrato que `idiomaDoVisitante` já lê na cadeia
 * `perfil → cookie → Accept-Language`.
 *
 * Escrever o cookie no servidor (e não `document.cookie` no cliente) mantém o
 * valor sob a mesma política SameSite do produto e fora do alcance de scripts
 * de terceiros no browser.
 */
export async function salvarIdiomaDoVisitante(idioma: Idioma): Promise<{ ok: true }> {
  const jar = await cookies();
  jar.set(IDIOMA_VISITANTE_COOKIE, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "strict",
  });
  return { ok: true };
}
