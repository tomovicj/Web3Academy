import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "@/lib/utils";
import { useTokens } from "@/hooks/useTokens";
import { TokenPair } from "@/types/dex";

function PairSelector({
  selectedPair,
  setSelectedPair,
}: {
  selectedPair?: string;
  setSelectedPair: (selectedPair?: string) => void;
}) {
  const { pairs } = useTokens();

  const [open, setOpen] = React.useState<boolean>(false);

  const formatPair = (pair?: TokenPair) => {
    if (!pair) return;
    return `${pair.token0.symbol} / ${pair.token1.symbol}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPair
            ? formatPair(pairs.find((pair) => pair.address === selectedPair))
            : "Select token pair..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-lg p-0">
        <Command>
          <CommandInput placeholder="Search token pairs..." />
          <CommandList>
            <CommandEmpty>No token pairs.</CommandEmpty>
            <CommandGroup>
              {pairs.map((pair) => (
                <CommandItem
                  key={pair.address}
                  value={pair.address}
                  onSelect={(currentValue) => {
                    setSelectedPair(
                      currentValue === selectedPair ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPair === pair.address
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {`${pair.token0.symbol} / ${pair.token1.symbol}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default PairSelector;
