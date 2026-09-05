import type { ReactNode } from "react";
import { AxiosProvider } from "./axios/AxiosProvider";
import { QueryProvider } from "./query/QueryProvider";

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <AxiosProvider>
      <QueryProvider>{children}</QueryProvider>
    </AxiosProvider>
  );
}
