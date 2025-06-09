import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EzSwapFactory, EzSwapFactory__factory, MockERC20, MockERC20__factory } from "../typechain-types";

describe("EzSwapFactory", function () {
  let factory: EzSwapFactory;
  let factoryAddress: string;
  let mockToken0: MockERC20;
  let mockToken1: MockERC20;
  let mockToken2: MockERC20;
  let mockToken0Address: string;
  let mockToken1Address: string;
  let mockToken2Address: string;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    mockToken0 = await new MockERC20__factory().connect(owner).deploy("Token0", "TK0", 18);
    mockToken1 = await new MockERC20__factory().connect(owner).deploy("Token1", "TK1", 18);
    mockToken2 = await new MockERC20__factory().connect(owner).deploy("Token2", "TK2", 18);

    await mockToken0.waitForDeployment();
    await mockToken1.waitForDeployment();
    await mockToken2.waitForDeployment();

    mockToken0Address = await mockToken0.getAddress();
    mockToken1Address = await mockToken1.getAddress();
    mockToken2Address = await mockToken2.getAddress();

    // Deploy EzSwapFactory
    factory = await new EzSwapFactory__factory().connect(owner).deploy();
    await factory.waitForDeployment();
    factoryAddress = await factory.getAddress();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(factoryAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have empty allPairs array initially", async function () {
      expect(await factory.allPairsLength()).to.equal(0);
    });
  });

  describe("allPairsLength", function () {
    it("Should return 0 initially", async function () {
      expect(await factory.allPairsLength()).to.equal(0);
    });

    it("Should return correct length after creating pairs", async function () {
      await factory.createPair(mockToken0Address, mockToken1Address);
      expect(await factory.allPairsLength()).to.equal(1);

      await factory.createPair(mockToken0Address, mockToken2Address);
      expect(await factory.allPairsLength()).to.equal(2);
    });
  });

  describe("createPair", function () {
    describe("Input validation", function () {
      it("Should revert when tokenA equals tokenB", async function () {
        await expect(
          factory.createPair(mockToken0Address, mockToken0Address)
        ).to.be.revertedWithCustomError(factory, "IdenticalAddresses");
      });

      it("Should revert when tokenA is zero address", async function () {
        await expect(
          factory.createPair(ethers.ZeroAddress, mockToken1Address)
        ).to.be.revertedWithCustomError(factory, "ZeroAddress");
      });

      it("Should revert when tokenB is zero address", async function () {
        await expect(
          factory.createPair(mockToken0Address, ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(factory, "ZeroAddress");
      });

      it("Should revert when both tokens are zero address", async function () {
        await expect(
          factory.createPair(ethers.ZeroAddress, ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(factory, "ZeroAddress");
      });
    });

    describe("Pair existence checks", function () {
      it("Should revert when pair already exists (tokenA, tokenB)", async function () {
        await factory.createPair(mockToken0Address, mockToken1Address);

        await expect(
          factory.createPair(mockToken0Address, mockToken1Address)
        ).to.be.revertedWithCustomError(factory, "PairExists");
      });

      it("Should revert when pair already exists (tokenB, tokenA)", async function () {
        await factory.createPair(mockToken0Address, mockToken1Address);

        await expect(
          factory.createPair(mockToken1Address, mockToken0Address)
        ).to.be.revertedWithCustomError(factory, "PairExists");
      });
    });

    describe("Successful pair creation", function () {
      it("Should create pair successfully", async function () {
        const tx = await factory.createPair(
          mockToken0Address,
          mockToken1Address
        );
        const receipt = await tx.wait();

        expect(receipt).to.not.be.null;
        expect(receipt?.status).to.equal(1);
      });

      it("Should return valid pair address", async function () {
        const pairAddress = await factory.createPair.staticCall(
          mockToken0Address,
          mockToken1Address
        );

        expect(pairAddress).to.not.equal(ethers.ZeroAddress);
        expect(ethers.isAddress(pairAddress)).to.be.true;
      });

      it("Should store pair in getPair mapping (both directions)", async function () {
        await factory.createPair(mockToken0Address, mockToken1Address);

        const [token0, token1] =
          mockToken0Address < mockToken1Address
            ? [mockToken0Address, mockToken1Address]
            : [mockToken1Address, mockToken0Address];

        const pair1 = await factory.getPair(token0, token1);
        const pair2 = await factory.getPair(token1, token0);

        expect(pair1).to.not.equal(ethers.ZeroAddress);
        expect(pair2).to.not.equal(ethers.ZeroAddress);
        expect(pair1).to.equal(pair2);
      });

      it("Should add pair to allPairs array", async function () {
        const initialLength: BigInt = await factory.allPairsLength();
        await factory.createPair(mockToken0Address, mockToken1Address);
        const finalLength: BigInt = await factory.allPairsLength();

        expect(finalLength).to.equal(initialLength.valueOf() + BigInt(1));

        const pairAddress = await factory.allPairs(finalLength.valueOf() - BigInt(1));
        expect(pairAddress).to.not.equal(ethers.ZeroAddress);
      });

      it("Should emit PairCreated event", async function () {
        const [token0, token1] =
          mockToken0Address < mockToken1Address
            ? [mockToken0Address, mockToken1Address]
            : [mockToken1Address, mockToken0Address];

        await expect(factory.createPair(mockToken0Address, mockToken1Address))
          .to.emit(factory, "PairCreated")
          .withArgs(token0, token1, (pairAddress: string) => {
            return ethers.isAddress(pairAddress);
          });
      });

      it("Should create different addresses for different token pairs", async function () {
        const pair1Address = await factory.createPair.staticCall(
          mockToken0Address,
          mockToken1Address
        );
        await factory.createPair(mockToken0Address, mockToken1Address);

        const pair2Address = await factory.createPair.staticCall(
          mockToken0Address,
          mockToken2Address
        );
        await factory.createPair(mockToken0Address, mockToken2Address);

        expect(pair1Address).to.not.equal(pair2Address);
      });

      it("Should create same address for same tokens regardless of order", async function () {
        const pair1Address = await factory.createPair.staticCall(
          mockToken0Address,
          mockToken1Address
        );

        const pair2Address = await factory.createPair.staticCall(
          mockToken1Address,
          mockToken0Address
        );

        expect(pair1Address).to.equal(pair2Address);
      });
    });

    describe("Address sorting", function () {
      it("Should handle token addresses correctly regardless of input order", async function () {
        // Create pair with tokens in one order
        await factory.createPair(mockToken0Address, mockToken1Address);

        const [expectedToken0, expectedToken1] =
          mockToken0Address < mockToken1Address
            ? [mockToken0Address, mockToken1Address]
            : [mockToken1Address, mockToken0Address];

        const storedPair = await factory.getPair(
          expectedToken0,
          expectedToken1
        );
        expect(storedPair).to.not.equal(ethers.ZeroAddress);
      });
    });

    describe("Gas optimization tests", function () {
      it("Should use reasonable amount of gas for pair creation", async function () {
        const tx = await factory.createPair(
          mockToken0Address,
          mockToken1Address
        );
        const receipt = await tx.wait();

        // Expect gas usage to be reasonable
        expect(receipt).to.not.be.null;
        expect(receipt?.gasUsed).to.be.lessThan(3000000);
      });
    });

    describe("Multiple pair creation", function () {
      it("Should create multiple pairs successfully", async function () {
        await factory.createPair(mockToken0Address, mockToken1Address);
        await factory.createPair(mockToken0Address, mockToken2Address);
        await factory.createPair(mockToken1Address, mockToken2Address);

        expect(await factory.allPairsLength()).to.equal(3);

        // Verify all pairs are stored correctly
        const pair1 = await factory.getPair(
          mockToken0Address,
          mockToken1Address
        );
        const pair2 = await factory.getPair(
          mockToken0Address,
          mockToken2Address
        );
        const pair3 = await factory.getPair(
          mockToken1Address,
          mockToken2Address
        );

        expect(pair1).to.not.equal(ethers.ZeroAddress);
        expect(pair2).to.not.equal(ethers.ZeroAddress);
        expect(pair3).to.not.equal(ethers.ZeroAddress);
        expect(pair1).to.not.equal(pair2);
        expect(pair2).to.not.equal(pair3);
        expect(pair1).to.not.equal(pair3);
      });
    });
  });

  describe("State consistency", function () {
    it("Should maintain consistent state after multiple operations", async function () {
      const pairs = [
        [mockToken0Address, mockToken1Address],
        [mockToken0Address, mockToken2Address],
        [mockToken1Address, mockToken2Address],
      ];

      for (const [tokenA, tokenB] of pairs) {
        await factory.createPair(tokenA, tokenB);
      }

      // Verify state consistency
      expect(await factory.allPairsLength()).to.equal(3);

      for (let i = 0; i < 3; i++) {
        const pairAddress = await factory.allPairs(i);
        expect(pairAddress).to.not.equal(ethers.ZeroAddress);
      }

      // Verify all pairs are accessible through getPair
      for (const [tokenA, tokenB] of pairs) {
        const pair1 = await factory.getPair(tokenA, tokenB);
        const pair2 = await factory.getPair(tokenB, tokenA);
        expect(pair1).to.equal(pair2);
        expect(pair1).to.not.equal(ethers.ZeroAddress);
      }
    });
  });
});
