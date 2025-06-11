export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface TokenPair {
  address: string;
  token0: Token;
  token1: Token;
}

export interface TokensContextType {
  pairs: TokenPair[];
  tokens: Record<string, Token>;
  loading: boolean;
  error: string | null;
  reloadData: () => Promise<void>;
}
