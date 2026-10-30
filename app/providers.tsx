"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { OrganizationTransitionProvider } from "@/components/shell/OrganizationTransitionProvider";
import { makeQueryClient } from "@/lib/query/client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <OrganizationTransitionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OrganizationTransitionProvider>
  );
}
