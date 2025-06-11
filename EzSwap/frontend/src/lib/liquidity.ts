import EzSwapPair from "@/ABI/EzSwapPair.json";
import MockERC20 from "@/ABI/MockERC20.json";

import { TokenPair } from "@/types/dex";
import { ethers } from "ethers";

export type LiquidityReserves = {
  token0: string;
  token1: string;
};

const PROVIDER = new ethers.BrowserProvider(
  window.ethereum as ethers.Eip1193Provider
);

export async function addLiquidity(
  pair: TokenPair,
  amount0: string,
  amount1: string,
  signer: ethers.Signer
): Promise<void> {
  const pairContract = new ethers.Contract(
    pair.address,
    EzSwapPair.abi,
    signer
  );
  const token0Contract = new ethers.Contract(
    pair.token0.address,
    MockERC20.abi,
    signer
  );
  const token1Contract = new ethers.Contract(
    pair.token1.address,
    MockERC20.abi,
    signer
  );

  // Approve the pair contract to spend token0 and token1
  await token0Contract.approve(pair.address, ethers.parseEther(amount0), {});
  await token1Contract.approve(pair.address, ethers.parseEther(amount1), {});

  return pairContract.addLiquidity(
    ethers.parseEther(amount1),
    ethers.parseEther(amount0),
    { gasLimit: 500000 }
  );
}

export function removeLiquidity(
  pairAddress: string,
  liquidity: string,
  signer: ethers.Signer
): Promise<void> {
  const pairContract = new ethers.Contract(pairAddress, EzSwapPair.abi, signer);
  return pairContract.removeLiquidity(ethers.parseEther(liquidity), {
    gasLimit: 500000,
  });
}

export async function getReserves(
  pairAddress: string
): Promise<LiquidityReserves> {
  const pairContract = new ethers.Contract(
    pairAddress,
    EzSwapPair.abi,
    PROVIDER
  );
  const liquidity = await pairContract.getReserves.staticCall();
  return {
    token0: ethers.formatEther(liquidity[0]),
    token1: ethers.formatEther(liquidity[1]),
  };
}

export async function getLiquidity(pairAddress: string): Promise<string> {
  const pairContract = new ethers.Contract(
    pairAddress,
    EzSwapPair.abi,
    PROVIDER
  );
  const liquidity = await pairContract.totalSupply.staticCall();
  return ethers.formatEther(liquidity);
}

export async function getLiquidityForAddress(
  pairAddress: string,
  userAddress: string
): Promise<string> {
  const pairContract = new ethers.Contract(
    pairAddress,
    EzSwapPair.abi,
    PROVIDER
  );
  const liquidity = await pairContract.balanceOf.staticCall(userAddress);
  return ethers.formatEther(liquidity);
}
