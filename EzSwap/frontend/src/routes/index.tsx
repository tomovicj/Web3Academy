import { createFileRoute } from "@tanstack/react-router";

import SwapInterface from "@/components/SwapCard";
import ClaimTokensAlert from "@/components/ClaimTokensAlert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiquidityCard from "@/components/LiquidityCard";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="max-w-xl mx-auto my-4">
      <Tabs defaultValue="swap">
        <TabsList className="w-full">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
        </TabsList>
        <TabsContent value="swap">
          <SwapInterface />
        </TabsContent>
        <TabsContent value="liquidity">
          <LiquidityCard />
        </TabsContent>
      </Tabs>
      <ClaimTokensAlert />
    </div>
  );
}
