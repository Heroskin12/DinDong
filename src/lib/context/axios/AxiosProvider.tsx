"use client";

import { ReactNode } from "react";
import { AxiosContext } from "./AxiosContext";
import type { AxiosInstance } from "axios";
import api from "./api";

export function AxiosProvider({
  children,
  client = api,
}: {
  readonly children: ReactNode;
  readonly client?: AxiosInstance;
}) {
  return (
    <AxiosContext.Provider value={client}>{children}</AxiosContext.Provider>
  );
}
