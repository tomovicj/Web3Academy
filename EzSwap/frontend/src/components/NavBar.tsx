import React from "react";
import { redirect } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { useWalletContext } from "@/contexts/WalletContext";

function NavBar() {
  const { account, isLoading, connect, disconnect } = useWalletContext();

  return (
    <div className="w-full flex justify-between items-center p-4 bg-primary text-primary-foreground">
      <div>
        <Button onClick={() => redirect({ to: "/" })}>
          <span className="text-2xl font-bold">EzSwap</span>
        </Button>
      </div>
      <div>
        <Button
          variant="outline"
          className="bg-primary"
          disabled={isLoading}
          onClick={account ? disconnect : connect}
        >
          {account ? "Disconect Wallet" : "Connect Wallet"}
        </Button>
      </div>
    </div>
  );
}

export default NavBar;
