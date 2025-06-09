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
import { TokenSelector } from "./TokenSelector";
import { useWalletContext } from "@/contexts/WalletContext";
import { useTokens } from "@/hooks/useTokens";

function SwapInterface() {
  const wallet = useWalletContext();
  const tokensContext = useTokens();

  const [swapFrom, setSwapFrom] = React.useState<string>("WETH");
  const [swapFromAmount, setSwapFromAmount] = React.useState<string>("1.0");
  const [swapTo, setSwapTo] = React.useState<string>("DAI");
  const [swapToAmount, setSwapToAmount] = React.useState<string>("3.4");

  const handleTokenFlip = () => {
    const tempSwapTo = swapTo;
    const tempSwapToAmount = swapToAmount;
    setSwapTo(swapFrom);
    setSwapToAmount(swapFromAmount);
    setSwapFrom(tempSwapTo);
    setSwapFromAmount(tempSwapToAmount);
  };

  return (
    <Card className="max-w-xl mx-auto my-4">
      <CardHeader>
        <CardTitle>SWAP</CardTitle>
        <CardDescription>Trade tokens easily</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* From */}
        <div>
          <Label htmlFor="swap-from" className="mb-1">
            From:
          </Label>
          <div className="flex items-center w-full gap-1">
            <Input
              id="swap-from"
              type="text"
              value={swapFromAmount}
              onChange={(e) => setSwapFromAmount(e.target.value)}
            />
            <TokenSelector
              selectedToken={swapFrom}
              onSelectToken={setSwapFrom}
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
            To:
          </Label>
          <div className="flex items-center w-full gap-1">
            <Input
              id="swap-to"
              type="text"
              value={swapToAmount}
              onChange={(e) => setSwapToAmount(e.target.value)}
            />
            <TokenSelector selectedToken={swapTo} onSelectToken={setSwapTo} />
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
              // Handle swap logic here
              console.log(
                `Swapping ${swapFromAmount} ${swapFrom} for ${swapToAmount} ${swapTo}`
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
