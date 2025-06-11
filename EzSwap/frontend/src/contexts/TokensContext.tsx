import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ethers } from "ethers";
import EzSwapFactory from "@/ABI/EzSwapFactory.json";
import EzSwapPair from "@/ABI/EzSwapPair.json";
import MockERC20 from "@/ABI/MockERC20.json";
import { Token, TokenPair, TokensContextType } from "@/types/dex";

const FACTORY_ABI = EzSwapFactory.abi;
const PAIR_ABI = EzSwapPair.abi;
const TOKEN_ABI = MockERC20.abi;

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || "";

export const TokensContext = createContext<TokensContextType | undefined>(undefined);

export const TokensProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pairs, setPairs] = useState<TokenPair[]>([]);
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Ethereum provider found");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        provider
      );
      const pairsLength = await factoryContract.allPairsLength();
      const newPairs: TokenPair[] = [];
      const newTokens: Record<string, Token> = {};

      for (let i = 0; i < pairsLength; i++) {
        const pairAddress = await factoryContract.allPairs(i);
        const pairContract = new ethers.Contract(
          pairAddress,
          PAIR_ABI,
          provider
        );
        const [token0, token1] = await Promise.all([
          pairContract.token0(),
          pairContract.token1(),
        ]);

        const token0Contract = new ethers.Contract(token0, TOKEN_ABI, provider);
        const token1Contract = new ethers.Contract(token1, TOKEN_ABI, provider);

        const [name0, symbol0, decimals0] = await Promise.all([
          token0Contract.name(),
          token0Contract.symbol(),
          token0Contract.decimals(),
        ]);
        newTokens[token0] = {
          address: token0,
          name: name0,
          symbol: symbol0,
          decimals: decimals0,
        };

        const [name1, symbol1, decimals1] = await Promise.all([
          token1Contract.name(),
          token1Contract.symbol(),
          token1Contract.decimals(),
        ]);
        newTokens[token1] = {
          address: token1,
          name: name1,
          symbol: symbol1,
          decimals: decimals1,
        };

        newPairs.push({
          address: pairAddress,
          token0: {
            address: token0,
            name: name0,
            symbol: symbol0,
            decimals: decimals0,
          },
          token1: {
            address: token1,
            name: name1,
            symbol: symbol1,
            decimals: decimals1,
          },
        });
      }

      setPairs(newPairs);
      setTokens(newTokens);
    } catch (err) {
      console.error(err);
      setError("Failed to load pairs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  return (
    <TokensContext.Provider value={{ pairs, tokens, loading, error, reloadData: loadData }}>
      {children}
    </TokensContext.Provider>
  );
};
