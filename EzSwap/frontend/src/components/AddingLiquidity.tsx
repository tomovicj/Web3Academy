import React, { useEffect } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
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
import { getReserves, LiquidityReserves } from "@/lib/liquidity";
import { WalletContextType } from "@/contexts/WalletContext";

interface AddingLiquidityProps {
  pair?: TokenPair;
  wallet: WalletContextType;
  setIsAdding: (isAdding: boolean) => void;
  amount0: string;
  setAmount0: (amount: string) => void;
  amount1: string;
  setAmount1: (amount: string) => void;
}

function AddingLiquidity(props: AddingLiquidityProps) {
  const [liquidityReserves, setLiquidityReserves] = React.useState<
    LiquidityReserves | undefined
  >();

  useEffect(() => {
    (async () => {
      if (!props.pair) {
        setLiquidityReserves(undefined);
        return;
      }

      const reserves = await getReserves(
        props.pair.address
      );
      setLiquidityReserves(reserves);
    })();
  }, [props.pair]);

  return (
    <div>
      <div className="flex flex-col gap-2 mt-4">
        <div>
          <Label htmlFor="token-a" className="my-1">
            {props.pair ? `${props.pair.token0.symbol}:` : "Token A:"}
          </Label>
          <Input
            id="token-a"
            disabled={!props.pair}
            value={props.amount0}
            onChange={(e) => props.setAmount0(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="token-b" className="my-1">
            {props.pair ? `${props.pair.token1.symbol}:` : "Token B:"}
          </Label>
          <Input
            id="token-b"
            disabled={!props.pair}
            value={props.amount1}
            onChange={(e) => props.setAmount1(e.target.value)}
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-4 z-10 relative">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={() => props.setIsAdding(false)}
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

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
                <span className="font-semibold">
                  {props.pair?.token0.symbol}:
                </span>{" "}
                {liquidityReserves?.token0 || "0.00"}
              </li>
              <li>
                <span className="font-semibold">
                  {props.pair?.token1.symbol}:
                </span>{" "}
                {liquidityReserves?.token1 || "0.00"}
              </li>
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default AddingLiquidity;
