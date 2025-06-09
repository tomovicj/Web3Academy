"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Token {
  symbol: string;
  name: string;
  balance: string;
}

interface TokenSelectorProps {
  selectedToken: string;
  onSelectToken: (token: string) => void;
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [t, setT] = useState<Token>();

  const tokens: Token[] = [
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "1.45",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: "2,400.00",
    },
    {
      symbol: "USDT",
      name: "Tether",
      balance: "1,200.00",
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      balance: "500.00",
    },
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      balance: "0.05",
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      balance: "75.00",
    },
    {
      symbol: "UNI",
      name: "Uniswap",
      balance: "120.00",
    },
    {
      symbol: "AAVE",
      name: "Aave",
      balance: "10.00",
    },
  ];

  useEffect(() => {
    setT(tokens.find((t) => t.symbol === selectedToken) || tokens[0]);
  }, [selectedToken]);

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: Token) => {
    setT(token);
    onSelectToken(token.symbol);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          {t?.symbol}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4" />
          <Input
            placeholder="Search by name or symbol"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {filteredTokens.map((token) => (
              <Button
                key={token.symbol}
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => handleSelectToken(token)}
              >
                <div className="flex flex-col items-start">
                  <span>{token.symbol}</span>
                  <span className="text-xs">{token.name}</span>
                </div>
                <div className="ml-auto text-right">
                  <span>{token.balance}</span>
                </div>
              </Button>
            ))}
            {filteredTokens.length === 0 && (
              <div className="py-6 text-center">No tokens found</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
