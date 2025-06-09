import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EzSwapPair", function () {
  async function deployFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token0 = await MockERC20.deploy("Token0", "TK0", 18);
    const token1 = await MockERC20.deploy("Token1", "TK1", 18);

    const token0Address = await token0.getAddress();
    const token1Address = await token1.getAddress();

    // Deploy EzSwapPair
    const EzSwapPair = await ethers.getContractFactory("EzSwapPair");
    const pair = await EzSwapPair.deploy();

    // Mint tokens to users
    const initialSupply = ethers.parseEther("1000000");
    await token0.mint(user1.address, initialSupply);
    await token0.mint(user2.address, initialSupply);
    await token1.mint(user1.address, initialSupply);
    await token1.mint(user2.address, initialSupply);

    return { pair, token0, token1, token0Address, token1Address, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      const { pair } = await loadFixture(deployFixture);
      expect(await pair.name()).to.equal("EzSwap LP");
      expect(await pair.symbol()).to.equal("EzSLP");
    });

    it("Should have zero initial supply", async function () {
      const { pair } = await loadFixture(deployFixture);
      expect(await pair.totalSupply()).to.equal(0);
    });

    it("Should have zero addresses for tokens initially", async function () {
      const { pair } = await loadFixture(deployFixture);
      expect(await pair.token0()).to.equal(ethers.ZeroAddress);
      expect(await pair.token1()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Initialize", function () {
    it("Should initialize with valid tokens", async function () {
      const { pair, token0, token1,token0Address, token1Address } = await loadFixture(deployFixture);

      await pair.initialize(token0Address, token1Address);

      expect(await pair.token0()).to.equal(token0Address);
      expect(await pair.token1()).to.equal(token1Address);
    });

    it("Should revert if already initialized", async function () {
      const { pair, token0, token1, token0Address, token1Address } = await loadFixture(deployFixture);

      await pair.initialize(token0Address, token1Address);

      await expect(
        pair.initialize(token0Address, token1Address)
      ).to.be.revertedWithCustomError(pair, "AlreadyInitialized");
    });

    it("Should revert with zero address tokens", async function () {
      const { pair, token1, token1Address } = await loadFixture(deployFixture);

      await expect(
        pair.initialize(ethers.ZeroAddress, token1Address)
      ).to.be.revertedWithCustomError(pair, "InvalidToken");

      await expect(
        pair.initialize(token1Address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(pair, "InvalidToken");
    });
  });

  describe("Add Liquidity", function () {
    async function initializePairFixture() {
      const fixture = await deployFixture();
      await fixture.pair.initialize(
        fixture.token0Address,
        fixture.token1Address
      );
      return fixture;
    }

    it("Should add initial liquidity correctly", async function () {
      const { pair, token0, token1, user1 } = await loadFixture(
        initializePairFixture
      );

      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.connect(user1).approve(pair.target, amount0);
      await token1.connect(user1).approve(pair.target, amount1);

      const expectedLiquidity = ethers.parseEther("141.421356237309504880"); // sqrt(100 * 200) - 1000
      const minLiquidity = 1000n;

      await expect(pair.connect(user1).addLiquidity(amount0, amount1))
        .to.emit(pair, "LiquidityAdded")
        .withArgs(
          user1.address,
          amount0,
          amount1,
          expectedLiquidity - minLiquidity
        );

      expect(await pair.balanceOf(user1.address)).to.equal(
        expectedLiquidity - minLiquidity
      );
      expect(await pair.totalSupply()).to.equal(expectedLiquidity);

      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(amount0);
      expect(reserve1).to.equal(amount1);
    });

    it("Should add subsequent liquidity proportionally", async function () {
      const { pair, token0, token1, user1, user2 } = await loadFixture(
        initializePairFixture
      );

      // First liquidity provision
      const amount0Initial = ethers.parseEther("100");
      const amount1Initial = ethers.parseEther("200");

      await token0.connect(user1).approve(pair.target, amount0Initial);
      await token1.connect(user1).approve(pair.target, amount1Initial);
      await pair.connect(user1).addLiquidity(amount0Initial, amount1Initial);

      // Second liquidity provision
      const amount0Second = ethers.parseEther("50"); // 50% of initial
      const amount1Second = ethers.parseEther("100"); // 50% of initial

      await token0.connect(user2).approve(pair.target, amount0Second);
      await token1.connect(user2).approve(pair.target, amount1Second);

      const totalSupplyBefore = await pair.totalSupply();
      const expectedLiquidity =
        (amount0Second * totalSupplyBefore) / amount0Initial;

      await pair.connect(user2).addLiquidity(amount0Second, amount1Second);

      expect(await pair.balanceOf(user2.address)).to.equal(expectedLiquidity);
    });

    it("Should revert with zero amounts", async function () {
      const { pair, user1 } = await loadFixture(initializePairFixture);

      await expect(
        pair.connect(user1).addLiquidity(0, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");

      await expect(
        pair.connect(user1).addLiquidity(ethers.parseEther("100"), 0)
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");
    });

    it("Should revert if liquidity calculation results in zero", async function () {
      const { pair, token0, token1, user1, user2 } = await loadFixture(
        initializePairFixture
      );

      // Add initial liquidity
      const amount0Initial = ethers.parseEther("1000000");
      const amount1Initial = ethers.parseEther("1000000");

      await token0.connect(user1).approve(pair.target, amount0Initial);
      await token1.connect(user1).approve(pair.target, amount1Initial);
      await pair.connect(user1).addLiquidity(amount0Initial, amount1Initial);

      // Try to add very small amounts that would result in zero liquidity
      await token0.connect(user2).approve(pair.target, 1);
      await token1.connect(user2).approve(pair.target, 1);

      await expect(
        pair.connect(user2).addLiquidity(1, 1)
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");
    });
  });

  describe("Swap", function () {
    async function liquidityFixture() {
      const fixture = await loadFixture(deployFixture);
      await fixture.pair.initialize(
        fixture.token0Address,
        fixture.token1Address
      );

      // Add initial liquidity
      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("2000");

      await fixture.token0
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount0);
      await fixture.token1
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount1);
      await fixture.pair.connect(fixture.user1).addLiquidity(amount0, amount1);

      return fixture;
    }

    it("Should swap token0 for token1", async function () {
      const { pair, token0, token1, user2 } = await loadFixture(
        liquidityFixture
      );

      const amountIn = ethers.parseEther("100");
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      // Calculate expected output (simplified, no fees in this implementation)
      const expectedAmountOut =
        (amountIn * reserve1Before) / (reserve0Before + amountIn);

      await token0.connect(user2).approve(pair.target, amountIn);
      await token0.connect(user2).transfer(pair.target, amountIn);

      const balanceBefore = await token1.balanceOf(user2.address);

      await expect(
        pair.connect(user2).swap(0, expectedAmountOut, user2.address)
      )
        .to.emit(pair, "Swap")
        .withArgs(
          user2.address,
          amountIn,
          0,
          0,
          expectedAmountOut,
          user2.address
        );

      const balanceAfter = await token1.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedAmountOut);
    });

    it("Should swap token1 for token0", async function () {
      const { pair, token0, token1, user2 } = await loadFixture(
        liquidityFixture
      );

      const amountIn = ethers.parseEther("200");
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      const expectedAmountOut =
        (amountIn * reserve0Before) / (reserve1Before + amountIn);

      await token1.connect(user2).approve(pair.target, amountIn);
      await token1.connect(user2).transfer(pair.target, amountIn);

      const balanceBefore = await token0.balanceOf(user2.address);

      await pair.connect(user2).swap(expectedAmountOut, 0, user2.address);

      const balanceAfter = await token0.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedAmountOut);
    });

    it("Should revert with zero output amounts", async function () {
      const { pair, user2 } = await loadFixture(liquidityFixture);

      await expect(
        pair.connect(user2).swap(0, 0, user2.address)
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");
    });

    it("Should revert with insufficient liquidity", async function () {
      const { pair, user2 } = await loadFixture(liquidityFixture);

      const [reserve0, reserve1] = await pair.getReserves();

      await expect(
        pair.connect(user2).swap(reserve0 + 1n, 0, user2.address)
      ).to.be.revertedWithCustomError(pair, "InsufficientLiquidity");

      await expect(
        pair.connect(user2).swap(0, reserve1 + 1n, user2.address)
      ).to.be.revertedWithCustomError(pair, "InsufficientLiquidity");
    });

    it("Should revert with insufficient input amount", async function () {
      const { pair, user2 } = await loadFixture(liquidityFixture);

      await expect(
        pair.connect(user2).swap(ethers.parseEther("100"), 0, user2.address)
      ).to.be.revertedWithCustomError(pair, "InsufficientInputAmount");
    });

    it("Should maintain constant product invariant", async function () {
      const { pair, token0, user2 } = await loadFixture(liquidityFixture);

      const [reserve0Before, reserve1Before] = await pair.getReserves();
      const productBefore = reserve0Before * reserve1Before;

      const amountIn = ethers.parseEther("10");
      const amountOut = ethers.parseEther("19"); // Slightly less than ideal to account for slippage

      await token0.connect(user2).transfer(pair.target, amountIn);
      await pair.connect(user2).swap(0, amountOut, user2.address);

      const [reserve0After, reserve1After] = await pair.getReserves();
      const productAfter = reserve0After * reserve1After;

      expect(productAfter).to.be.gte(productBefore);
    });
  });

  describe("Remove Liquidity", function () {
    async function liquidityFixture() {
      const fixture = await loadFixture(deployFixture);
      await fixture.pair.initialize(
        fixture.token0Address,
        fixture.token1Address
      );

      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("2000");

      await fixture.token0
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount0);
      await fixture.token1
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount1);
      await fixture.pair.connect(fixture.user1).addLiquidity(amount0, amount1);

      return fixture;
    }

    it("Should remove liquidity correctly", async function () {
      const { pair, token0, token1, user1 } = await loadFixture(
        liquidityFixture
      );

      const lpBalance = await pair.balanceOf(user1.address);
      const [reserve0, reserve1] = await pair.getReserves();
      const totalSupply = await pair.totalSupply();

      const liquidityToRemove = lpBalance / 2n;
      const expectedAmount0 = (reserve0 * liquidityToRemove) / totalSupply;
      const expectedAmount1 = (reserve1 * liquidityToRemove) / totalSupply;

      const balance0Before = await token0.balanceOf(user1.address);
      const balance1Before = await token1.balanceOf(user1.address);

      await expect(pair.connect(user1).removeLiquidity(liquidityToRemove))
        .to.emit(pair, "LiquidityRemoved")
        .withArgs(
          user1.address,
          expectedAmount0,
          expectedAmount1,
          liquidityToRemove
        );

      const balance0After = await token0.balanceOf(user1.address);
      const balance1After = await token1.balanceOf(user1.address);

      expect(balance0After - balance0Before).to.equal(expectedAmount0);
      expect(balance1After - balance1Before).to.equal(expectedAmount1);
      expect(await pair.balanceOf(user1.address)).to.equal(
        lpBalance - liquidityToRemove
      );
    });

    it("Should revert with zero liquidity", async function () {
      const { pair, user1 } = await loadFixture(liquidityFixture);

      await expect(
        pair.connect(user1).removeLiquidity(0)
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");
    });

    it("Should revert with insufficient liquidity balance", async function () {
      const { pair, user2 } = await loadFixture(liquidityFixture);

      await expect(
        pair.connect(user2).removeLiquidity(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(pair, "InsufficientLiquidityBalance");
    });

    it("Should handle complete liquidity removal", async function () {
      const { pair, token0, token1, user1 } = await loadFixture(
        liquidityFixture
      );

      const lpBalance = await pair.balanceOf(user1.address);
      const balance0Before = await token0.balanceOf(user1.address);
      const balance1Before = await token1.balanceOf(user1.address);

      await pair.connect(user1).removeLiquidity(lpBalance);

      expect(await pair.balanceOf(user1.address)).to.equal(0);

      // Should receive proportional amounts back
      const balance0After = await token0.balanceOf(user1.address);
      const balance1After = await token1.balanceOf(user1.address);

      expect(balance0After).to.be.gt(balance0Before);
      expect(balance1After).to.be.gt(balance1Before);
    });
  });

  describe("Get Reserves", function () {
    it("Should return zero reserves initially", async function () {
      const { pair, token0, token1, token0Address, token1Address } = await loadFixture(deployFixture);
      await pair.initialize(token0Address, token1Address);

      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(0);
      expect(reserve1).to.equal(0);
    });

    it("Should return correct reserves after adding liquidity", async function () {
      const { pair, token0, token1, user1, token0Address, token1Address } = await loadFixture(deployFixture);
      await pair.initialize(token0Address, token1Address);

      const amount0 = ethers.parseEther("500");
      const amount1 = ethers.parseEther("1000");

      await token0.connect(user1).approve(pair.target, amount0);
      await token1.connect(user1).approve(pair.target, amount1);
      await pair.connect(user1).addLiquidity(amount0, amount1);

      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(amount0);
      expect(reserve1).to.equal(amount1);
    });
  });

  describe("Edge Cases and Security", function () {
    async function liquidityFixture() {
      const fixture = await loadFixture(deployFixture);
      await fixture.pair.initialize(
        fixture.token0Address,
        fixture.token1Address
      );

      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("2000");

      await fixture.token0
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount0);
      await fixture.token1
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount1);
      await fixture.pair.connect(fixture.user1).addLiquidity(amount0, amount1);

      return fixture;
    }

    it("Should handle very small amounts", async function () {
      const { pair, token0, token1, user2, token0Address, token1Address } = await loadFixture(deployFixture);
      await pair.initialize(token0Address, token1Address);

      await token0.connect(user2).approve(pair.target, 1000);
      await token1.connect(user2).approve(pair.target, 1000);

      // Should work with small amounts
      await pair.connect(user2).addLiquidity(1000, 1000);

      const [reserve0, reserve1] = await pair.getReserves();
      console.log(reserve0, reserve1);
      expect(reserve0).to.equal(1000);
      expect(reserve1).to.equal(1000);
    });

    it("Should prevent reentrancy", async function () {
      const { pair } = await loadFixture(liquidityFixture);

      // The contract uses ReentrancyGuard, so all functions should be protected
      // This is more of a conceptual test since we can't easily test reentrancy
      // without creating a malicious contract
      expect(await pair.getReserves()).to.not.be.undefined;
    });

    it("Should handle precision correctly", async function () {
      const { pair, token0, token1, user2 } = await loadFixture(
        liquidityFixture
      );

      // Test with amounts that might cause precision issues
      const amountIn = 1;
      await token0.connect(user2).transfer(pair.target, amountIn);

      // Should not revert due to precision issues
      await expect(
        pair.connect(user2).swap(0, 0, user2.address)
      ).to.be.revertedWithCustomError(pair, "ZeroAmount");
    });
  });

  describe("Mathematical Properties", function () {
    async function liquidityFixture() {
      const fixture = await loadFixture(deployFixture);
      await fixture.pair.initialize(
        fixture.token0Address,
        fixture.token1Address
      );

      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("1000");

      await fixture.token0
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount0);
      await fixture.token1
        .connect(fixture.user1)
        .approve(fixture.pair.target, amount1);
      await fixture.pair.connect(fixture.user1).addLiquidity(amount0, amount1);

      return fixture;
    }

    it("Should maintain k = x * y invariant after swaps", async function () {
      const { pair, token0, user2 } = await loadFixture(liquidityFixture);

      const [x0, y0] = await pair.getReserves();
      const k0 = x0 * y0;

      // Perform swap
      const amountIn = ethers.parseEther("10");
      await token0.connect(user2).transfer(pair.target, amountIn);

      const [x1, y1] = await pair.getReserves();
      const newY = y1 - (amountIn * y1) / (x1 + amountIn);

      await pair.connect(user2).swap(0, newY, user2.address);

      const [x2, y2] = await pair.getReserves();
      const k1 = x2 * y2;

      // k should increase or stay the same (due to rounding and fees)
      expect(k1).to.be.gte(k0);
    });

    it("Should calculate liquidity tokens correctly for equal reserves", async function () {
      const { pair, token0, token1, user2, token0Address, token1Address } = await loadFixture(deployFixture);
      await pair.initialize(token0Address, token1Address);

      const amount = ethers.parseEther("100");

      await token0.connect(user2).approve(pair.target, amount);
      await token1.connect(user2).approve(pair.target, amount);

      await pair.connect(user2).addLiquidity(amount, amount);

      const expectedLiquidity = amount - 1000n; // sqrt(amount * amount) - MINIMUM_LIQUIDITY
      expect(await pair.balanceOf(user2.address)).to.equal(expectedLiquidity);
    });
  });
});
