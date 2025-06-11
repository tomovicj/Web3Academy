import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { createNewPair } from "@/lib/liquidity";
import { ethers } from "ethers";
import { useTokens } from "@/hooks/useTokens";

function NewTokenPair({ signer }: { signer: ethers.Signer | null }) {
  const { reloadData } = useTokens();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [token0, setToken0] = React.useState<string>("");
  const [token1, setToken1] = React.useState<string>("");

  const handleCreatePair = () => {
    if (!signer) {
      console.error("Signer is not provided");
      return;
    }
    if (!token0 || !token1) {
      console.error("Both token addresses must be provided");
      return;
    }
    if (token0 === token1) {
      console.error("Token addresses must be different");
      return;
    }
    if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
      console.error("Invalid token address format");
      return;
    }
    try {
      createNewPair(token0, token1, signer);
      reloadData();
    } catch (error) {
      console.error("Error creating new token pair:", error);
    }
    setToken0("");
    setToken1("");
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setToken0("");
      setToken1("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!signer}>New Pair</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new token pair</DialogTitle>
          <DialogDescription>
            Enter the addresses of the two tokens you want to create a pair for.
            Ensure that both addresses are valid and different.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="token-0" className="my-1">
            Address of token A:
          </Label>
          <Input
            id="token-0"
            value={token0}
            onChange={(e) => setToken0(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="token-1" className="my-1">
            Address of token B:
          </Label>
          <Input
            id="token-1"
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleCreatePair}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewTokenPair;
