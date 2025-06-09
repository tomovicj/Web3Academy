// src/hooks/useTokens.ts
import { useContext } from "react";
import { TokensContext } from "@/contexts/TokensContext";

export function useTokens() {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error("useTokens must be used within a TokensProvider");
  }
  return context;
}
