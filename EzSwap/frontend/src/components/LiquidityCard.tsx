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
import { useTokens } from "@/hooks/useTokens";
import { TokenPair } from "@/types/dex";
import { useWalletContext } from "@/contexts/WalletContext";
import { addLiquidity, removeLiquidity } from "@/lib/liquidity";
import AddingLiquidity from "./AddingLiquidity";
import RemovingLiquidity from "./RemovingLiquidity";

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
  const [liquidityInput, setLiquidityInput] = React.useState<string>("0.0");

  useEffect(() => {
    const pair = pairs.find((p) => p.address === selectedPairAddress);
    setSelectedPair(pair);
  }, [pairs, selectedPairAddress]);

  const handleAddRemoveLiquidity = () => {
    if (!wallet.signer || !selectedPair) return;
    if (isAdding) {
      addLiquidity(selectedPair, amount0, amount1, wallet.signer)
        .then(() => {
          console.log("Liquidity added successfully");
          setAmount0("0.0");
          setAmount1("0.0");
          setSelectedPairAddres(undefined);
        })
        .catch((error) => {
          console.error("Error adding liquidity:", error);
        });
    } else {
      removeLiquidity(selectedPair.address, liquidityInput, wallet.signer)
        .then(() => {
          console.log("Liquidity removed successfully");
          setLiquidityInput("0.0");
          setSelectedPairAddres(undefined);
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
        <CardDescription>{`${isAdding ? "ADD" : "REMOVE"} liquidity`}</CardDescription>
      </CardHeader>
      <CardContent>
        <PairSelector
          selectedPair={selectedPairAddress}
          setSelectedPair={setSelectedPairAddres}
        />
        {isAdding ? (
          <AddingLiquidity
            setIsAdding={setIsAdding}
            wallet={wallet}
            pair={selectedPair}
            amount0={amount0}
            setAmount0={setAmount0}
            amount1={amount1}
            setAmount1={setAmount1}
          />
        ) : (
          <RemovingLiquidity
            pair={selectedPair}
            setIsAdding={setIsAdding}
            wallet={wallet}
            liquidityInput={liquidityInput}
            setLiquidityInput={setLiquidityInput}
          />
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={
            wallet.isLoading || (wallet.account != null && !selectedPair)
          }
          onClick={!wallet.account ? wallet.connect : handleAddRemoveLiquidity}
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
