import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EzSwapDev", (m) => {
  const factoryContract = m.contract("EzSwapFactory", []);

  const token0Contract = m.contract("MockERC20", ["Token1", "T1", 18], { id: "MockToken1" });

  const token1Contract = m.contract("MockERC20", ["Token2", "T2", 18], { id: "MockToken2" });

  const token2Contract = m.contract("MockERC20", ["Token3", "T3", 18], { id: "MockToken3" });

  return { factoryContract, token0Contract, token1Contract, token2Contract };
});
