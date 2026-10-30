"use client";
import { useTransition } from "react";

import { salvarIdiomaDoVisitante } from "@/app/actions/settings/salvarIdiomaDoVisitante";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/hooks/i18n/useT";
import { useAplicarIdioma, useIdioma } from "@/lib/i18n/IdiomaProvider";
import { type Idioma } from "@/lib/i18n/idiomas";
import { IDIOMAS_VISIVEIS, idiomaVisivelPorCodigo } from "@/lib/i18n/registro";
import { Check } from "@/lib/ui/icons";

/**
 * O seletor de idioma das telas PÚBLICAS (login, cadastro, recuperação).
 *
 * ─── Por que um componente separado do `SeletorDeIdioma` ────────────────────
 *
 * Aquele grava no PERFIL (`trocarIdioma`, server action) — aqui ainda não há
 * perfil onde gravar. A preferência do visitante mora num cookie de um ano,
 * lido por `idiomaDoVisitante` na mesma cadeia que já resolvia o
 * `Accept-Language`.
 *
 * ─── O rótulo é o código, e é de propósito ─────────────────────────────────
 *
 * "PT" / "ES" são legíveis nos dois idiomas e cabem no mesmo espaço de um
 * ícone — mesmo raciocínio do `SeletorDeIdioma.tsx`, e por isso a mesma cara.
 */
export function SeletorDeIdiomaAnonimo() {
  const t = useT();
  const idioma = useIdioma();
  const emVigor = idiomaVisivelPorCodigo(idioma);
  const aplicar = useAplicarIdioma();
  const [, startTransition] = useTransition();

  const escolher = (novo: Idioma) => {
    if (novo === idioma) return;
    aplicar(novo);
    startTransition(async () => {
      await salvarIdiomaDoVisitante(novo);
      // Recarga inteira: o `IdiomaProvider` é montado pelo layout do servidor,
      // e só um novo render dele serve a tela no idioma novo.
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t("Idioma")}: ${emVigor.nomeNativo}`}
          data-testid="seletor-de-idioma-anonimo"
        >
          <span className="text-xs font-semibold tabular-nums">
            {emVigor.rotuloCurto}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {IDIOMAS_VISIVEIS.map(({ codigo, nomeNativo }) => (
          <DropdownMenuItem
            key={codigo}
            onClick={() => escolher(codigo)}
            data-testid={`idioma-anonimo-${codigo}`}
            aria-current={codigo === idioma}
          >
            <Check
              size={16}
              className={`mr-2 ${codigo === idioma ? "" : "invisible"}`}
              aria-hidden
            />
            {nomeNativo}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
