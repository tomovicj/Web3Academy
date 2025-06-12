import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ethers } from "ethers";
import MockERC20 from "@/ABI/MockERC20.json";
import { Button } from "./ui/button";
import { AlertCircleIcon } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";

function ClaimTokensAlert() {
  const wallet =  useWalletContext();

  const claimTokens = async () => {
    if (!wallet.account) {
      console.error("Wallet is not connected");
      return;
    }

    if (!wallet.signer) {
      console.error("Signer is not available");
      return;
    }

    const token1Address = import.meta.env.VITE_TOKEN1_ADDRESS;
    const token2Address = import.meta.env.VITE_TOKEN2_ADDRESS;
    const token3Address = import.meta.env.VITE_TOKEN3_ADDRESS;

    if (!token1Address || !token2Address || !token3Address) {
      console.error("Token addresses are not set in environment variables");
      return;
    }

    const token1Contract = new ethers.Contract(
      token1Address,
      MockERC20.abi,
      wallet.signer
    );
    const token2Contract = new ethers.Contract(
      token2Address,
      MockERC20.abi,
      wallet.signer
    );
    const token3Contract = new ethers.Contract(
      token3Address,
      MockERC20.abi,
      wallet.signer
    );

    await token1Contract.mint(
      wallet.account,
      ethers.parseEther("1000")
    );
    await token2Contract.mint(
      wallet.account,
      ethers.parseEther("1000")
    );
    await token3Contract.mint(
      wallet.account,
      ethers.parseEther("1000")
    );
  };

  if (!wallet.account) {
    return null; // Don't render the alert if the wallet is not connected
  }

  return (
    <Alert variant="default" className="max-w-xl mx-auto my-4">
      <AlertCircleIcon />
      <AlertTitle>You can claim TEST tokens to test the swap functionality</AlertTitle>
      <AlertDescription>
        <Button onClick={claimTokens} className="w-full">Claim tokens</Button>
      </AlertDescription>
    </Alert>
  );
}

export default ClaimTokensAlert;
