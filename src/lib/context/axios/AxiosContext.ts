import { createContext, useContext } from "react";
import type { AxiosInstance } from "axios";

export type AxiosContextValue = AxiosInstance | null;

export const AxiosContext = createContext<AxiosContextValue>(null);

export function useAxios() {
  const context = useContext(AxiosContext);
  if (!context) {
    throw new Error("useAxios must be used within an AxiosProvider.");
  }
  return context;
}
