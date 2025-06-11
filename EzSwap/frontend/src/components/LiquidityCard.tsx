import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import PairSelector from "./PairSelector";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTokens } from "@/hooks/useTokens";
import { TokenPair } from "@/types/dex";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { addLiquidity, getLiquidity, LiquidityReserves, removeLiquidity } from "@/lib/liquidity";

function LiquidityCard() {
  const wallet = useWalletContext();
  const { pairs } = useTokens();

  const [isAdding, setIsAdding] = React.useState<boolean>(true);
  const [selectedPair, setSelectedPair] = React.useState<TokenPair | undefined>(
    undefined
  );
  const [selectedPairAddress, setSelectedPairAddres] = React.useState<
    string | undefined
  >(undefined);
  const [amount0, setAmount0] = React.useState<string>("0.0");
  const [amount1, setAmount1] = React.useState<string>("0.0");
  const [liquidity, setLiquidity] = React.useState<string>("0.0");
  const [liquidityReserves, setLiquidityReserves] = React.useState<LiquidityReserves | undefined>();

  useEffect(() => {
    const pair = pairs.find((p) => p.address === selectedPairAddress);
    setSelectedPair(pair);
    if (pair && wallet.provider) {
     (async () => {
      const reserves = await getLiquidity(pair.address, wallet.provider!);
      setLiquidityReserves(reserves);
     })();
    } else {
      setLiquidityReserves(undefined);
    }
  }, [pairs, selectedPairAddress]);

  const handleAddRemoveLiquidity = () => {
    if (!wallet.signer || !selectedPair) return;
    if (isAdding) {
      addLiquidity(selectedPair, amount0, amount1, wallet.signer)
        .then(() => {
          console.log("Liquidity added successfully");
        })
        .catch((error) => {
          console.error("Error adding liquidity:", error);
        });
    } else {
      removeLiquidity(selectedPair.address, liquidity, wallet.signer)
        .then(() => {
          console.log("Liquidity removed successfully");
        })
        .catch((error) => {
          console.error("Error removing liquidity:", error);
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LIQUIDITY</CardTitle>
        <CardDescription>Add or remove liquidity</CardDescription>
      </CardHeader>
      <CardContent>
        <PairSelector
          selectedPair={selectedPairAddress}
          setSelectedPair={setSelectedPairAddres}
        />
        <div className="flex flex-col gap-2 mt-4">
          <div>
            <Label htmlFor="token-a" className="my-1">
              {selectedPair ? `${selectedPair.token0.symbol}:` : "Token A:"}
            </Label>
            <Input id="token-a" disabled={!selectedPair} value={amount0} onChange={e => setAmount0(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="token-b" className="my-1">
              {selectedPair ? `${selectedPair.token1.symbol}:` : "Token B:"}
            </Label>
            <Input id="token-b" disabled={!selectedPair} value={amount1} onChange={e => setAmount1(e.target.value)} />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center my-4 z-10 relative">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => setIsAdding((prev) => !prev)}
          >
            {isAdding ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liquidity pool</CardTitle>

            {selectedPair && (
              <CardDescription>{`${selectedPair?.token0.symbol} / ${selectedPair?.token1.symbol}`}</CardDescription>
            )}
          </CardHeader>
          {selectedPair && (
            <CardContent>
              <ul className="flex flex-col gap-2">
                <li>
                  <span className="font-semibold">
                    {selectedPair?.token0.symbol}:
                  </span>{" "}
                  {liquidityReserves?.token0 || "0.00"}
                </li>
                <li>
                  <span className="font-semibold">
                    {selectedPair?.token1.symbol}:
                  </span>{" "}
                  {liquidityReserves?.token1 || "0.00"}
                </li>
              </ul>
            </CardContent>
          )}
        </Card>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={
            wallet.isLoading || (wallet.account != null && !selectedPair)
          }
          onClick={
            !wallet.account ? wallet.connect : handleAddRemoveLiquidity
          }
        >
          {!wallet.account
            ? "Connect wallet"
            : isAdding
              ? "Add liquidity"
              : "Remove liquidity"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default LiquidityCard;
