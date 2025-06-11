import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ArrowDownUp } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useTokens } from "@/hooks/useTokens";
import PairSelector from "./PairSelector";
import { TokenPair } from "@/types/dex";
import { ethers } from "ethers";
import { getAmountIn, getAmountOut, handleSwap } from "@/lib/swap";
import { getReserves } from "@/lib/liquidity";

function SwapInterface() {
  const wallet = useWalletContext();
  const tokensContext = useTokens();

  const [pair, setPair] = React.useState<TokenPair | undefined>(undefined);
  const [selectedPair, setSelectedPair] = React.useState<string | undefined>(
    undefined
  );
  const [reversePair, setReversePair] = React.useState<boolean>(false);
  const [swapFromAmount, setSwapFromAmount] = React.useState<string>("0");
  const [swapToAmount, setSwapToAmount] = React.useState<string>("0");

  useEffect(() => {
    if (!selectedPair) return setPair(undefined);
    const foundPair = tokensContext.pairs.find(
      (p) => p.address === selectedPair
    );

    if (!foundPair) return setPair(undefined);
    setPair(foundPair);
  }, [tokensContext.pairs, selectedPair]);

  const handleTokenFlip = () => {
    setReversePair((prev) => !prev);
    const temp = swapFromAmount;
    setSwapFromAmount(swapToAmount);
    setSwapToAmount(temp);
  };

  const handleSwapFromChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setSwapFromAmount(value);
    if (value === "") {
      setSwapFromAmount("");
      setSwapToAmount("0");
      return;
    }
    if (/^[0-9]+\.?[0-9]*$/.test(value) === false) return; // Only allow numbers and decimal points
    if (pair) {
      const reserves = await getReserves(pair.address);
      const reservesSorted = reversePair
        ? [reserves.token1, reserves.token0]
        : [reserves.token0, reserves.token1];
      const amountOut = getAmountOut(
        ethers.parseEther(value),
        ethers.parseEther(reservesSorted[0]),
        ethers.parseEther(reservesSorted[1])
      );
      setSwapToAmount(ethers.formatEther(amountOut));
    }
  };

  const hadleSwapToChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSwapToAmount("");
      setSwapFromAmount("0");
      return;
    }
    if (/^[0-9]+\.?[0-9]*$/.test(value) === false) return; // Only allow numbers and decimal points

    setSwapToAmount(value);
    if (pair) {
      const reserves = await getReserves(pair.address);
      const reservesSorted = reversePair
        ? [reserves.token1, reserves.token0]
        : [reserves.token0, reserves.token1];
      const amountIn = getAmountIn(
        ethers.parseEther(value),
        ethers.parseEther(reservesSorted[0]),
        ethers.parseEther(reservesSorted[1])
      );
      setSwapFromAmount(ethers.formatEther(amountIn));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SWAP</CardTitle>
        <CardDescription>Trade tokens easily</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PairSelector
          selectedPair={selectedPair}
          setSelectedPair={setSelectedPair}
        />

        {/* From */}
        <div>
          <Label htmlFor="swap-from" className="my-1">
            {`From: ${(pair && (reversePair ? pair.token1.symbol : pair.token0.symbol)) || ""}`}
          </Label>
          <div className="flex items-center w-full gap-1">
            <Input
              id="swap-from"
              type="text"
              value={swapFromAmount}
              disabled={!pair}
              onChange={handleSwapFromChange}
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center mt-2 z-10 relative">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => handleTokenFlip()}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To */}
        <div>
          <Label htmlFor="swap-to" className="mb-1">
            {`To: ${(pair && (reversePair ? pair.token0.symbol : pair.token1.symbol)) || ""}`}
          </Label>
          <div className="flex items-center w-full gap-1">
            <Input
              id="swap-to"
              type="text"
              disabled={!pair}
              value={swapToAmount}
              onChange={hadleSwapToChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={wallet.isLoading}
          onClick={() => {
            if (!wallet.account) {
              wallet.connect();
            } else {
              if (!pair || !wallet.signer) return;
              handleSwap(
                pair?.address,
                reversePair ? pair?.token1.address : pair?.token0.address,
                ethers.parseEther(swapFromAmount),
                ethers.parseEther(swapToAmount),
                wallet.signer
              );
            }
          }}
        >
          {wallet.account ? "Swap Now!" : "Connect Wallet"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SwapInterface;
