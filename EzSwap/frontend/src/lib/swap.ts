import EzSwapPair from "@/ABI/EzSwapPair.json";
import MockERC20 from "@/ABI/MockERC20.json";
import { ethers } from "ethers";

export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
  if (amountOut <= 0 || amountOut >= reserveOut) {
    return BigInt(0);
  }
  return amountOut;
}

export function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint | number {
  if (amountOut >= reserveOut) {
    return BigInt(0);
  }
  const amountIn = (reserveIn * amountOut) / (reserveOut - amountOut);
  if (
    amountIn <= 0 ||
    reserveIn <= 0 ||
    reserveOut <= 0 ||
    amountIn >= reserveIn
  ) {
    return BigInt(0);
  }
  return amountIn;
}

export async function handleSwap(
  pairAddress: string,
  tokenInAddress: string,
  amountIn: bigint,
  amountOut: bigint,
  signer: ethers.Signer
): Promise<void> {
  const pairContract = new ethers.Contract(pairAddress, EzSwapPair.abi, signer);
  const tokenContract = new ethers.Contract(
    tokenInAddress,
    MockERC20.abi,
    signer
  );

  await tokenContract.transfer(pairAddress, amountIn);

  const token0 = await pairContract.token0();
  const userAddress = await signer.getAddress();

  if (token0.toLowerCase() === tokenInAddress.toLowerCase()) {
    return await pairContract.swap(0, amountOut, userAddress, {
      gasLimit: 500000,
    });
  } else {
    return await pairContract.swap(amountOut, 0, userAddress, {
      gasLimit: 500000,
    });
  }
}
