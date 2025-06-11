import React, { useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowDownUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { TokenPair } from "@/types/dex";
import { getLiquidity, getLiquidityForAddress } from "@/lib/liquidity";
import { WalletContextType } from "@/contexts/WalletContext";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface RemovingLiquidityProps {
  pair?: TokenPair;
  setIsAdding: (isAdding: boolean) => void;
  wallet: WalletContextType;
  liquidityInput: string;
  setLiquidityInput: (input: string) => void;
}

function RemovingLiquidity(props: RemovingLiquidityProps) {
  const [liquidity, setLiquidity] = React.useState<string>("0.0");
  const [userLiquidity, setUserLiquidity] = React.useState<string>("0.0");

  useEffect(() => {
    (async () => {
      if (!props.pair || !props.wallet.account) {
        setLiquidity("0.0");
        setUserLiquidity("0.0");
        return;
      }

      const newLiquidity = await getLiquidity(
        props.pair.address
      );
      setLiquidity(newLiquidity);

      const newUserLiquidity = await getLiquidityForAddress(
        props.pair.address,
        props.wallet.account
      );
      setUserLiquidity(newUserLiquidity);
    })();
  }, [props.pair]);

  return (
    <div className="flex flex-col gap-2 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Liquidity pool</CardTitle>
          {props.pair && (
            <CardDescription>{`${props.pair?.token0.symbol} / ${props.pair?.token1.symbol}`}</CardDescription>
          )}
        </CardHeader>
        {props.pair && (
          <CardContent>
            <ul className="flex flex-col gap-2">
              <li>
                <span className="font-semibold">TOTAL LIQUIDITY:</span>{" "}
                {liquidity}
              </li>
              <li>
                <span className="font-semibold">YOUR LIQUIDITY:</span>{" "}
                {userLiquidity}
              </li>
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Swap Button */}
      <div className="flex justify-center my-4 z-10 relative">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={() => props.setIsAdding(true)}
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <Label htmlFor="liquidity-input" className="my-1">
          Liquidity:
        </Label>
        <Input
          id="liquidity-input"
          disabled={!props.pair}
          value={props.liquidityInput}
          onChange={(e) => props.setLiquidityInput(e.target.value)}
        />
      </div>
    </div>
  );
}

export default RemovingLiquidity;
