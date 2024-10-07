import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { parseEther, EventLog, stripZerosLeft, zeroPadValue } from "ethers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-ethers";
import {
  readContractSierraCasm,
  readContractSierra,
  getTestProvider,
  getTestAccount,
} from "../scripts/config";
import {
  cairo,
  DeclareDeployUDCResponse,
  Contract as StarknetContract,
  shortString,
} from "starknet";
import {
  DualVMToken,
  DualVMToken__factory,
  LaunchpadPumpDualVM,
} from "../typechain-types";
import { formatFloatToUint256 } from "common";
import dotenv from "dotenv";
dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("PumpDualVM", function () {
  this.timeout(0);
  let pumpVM: LaunchpadPumpDualVM;
  let owner: HardhatEthersSigner;
  let ownerStarknet: bigint;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let DualVMTokenFactory: DualVMToken__factory;
  let dualVmQuoteToken: DualVMToken;

  const starknetLaunchpadSierra = readContractSierra("LaunchpadMarketplace");
  const starknetLaunchpadCasm = readContractSierraCasm("LaunchpadMarketplace");

  const starknetTokenSierra = readContractSierra("ERC20");
  const starknetTokenCasm = readContractSierraCasm("ERC20");
  let starknetToken: StarknetContract;

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let ddToken: DeclareDeployUDCResponse;
  let starknetLaunchpad: StarknetContract;

  const initialKeyPrice = cairo.uint256(1);
  const stepIncreaseLinear = cairo.uint256(1);

  /** TODO check correct format for uint256 */
  // const init_supply_nb = 100_000_000;

  // const init_supply = formatFloatToUint256(init_supply_nb);
  // const init_supply_bn = ethers.toBigInt(init_supply_nb);

  // const initial_key_price = cairo.uint256(1);
  // const step_increase_linear = cairo.uint256(1);

  /** TODO check correct format for uint256 */
  // const thresholdLiquidity = formatFloatToUint256(10);
  // const thresholdMarketcap = formatFloatToUint256(5000);
  const thresholdLiquidity = cairo.uint256(10);
  const thresholdMarketcap = cairo.uint256(500);

  const toBytes31 = (str: string) =>
    zeroPadValue(shortString.encodeShortString(str), 31);

  const fromBytes31 = (bytes31: string) =>
    shortString.decodeShortString(stripZerosLeft(bytes31));

  const computeStarknetAddress = async (evmAddress: string) => {
    const result = await account.callContract({
      contractAddress: KAKAROT_ADDRESS,
      calldata: [evmAddress],
      entrypoint: "compute_starknet_address",
    });
    return BigInt(result[0]);
  };

  const deployDualVmToken = async (tokenAddress: string) => {
    const dualVmToken = await DualVMTokenFactory.deploy(
      KAKAROT_ADDRESS,
      tokenAddress
    ).then((c) => c.waitForDeployment());
    // Whitelist the Dual Token contract to call Cairo contracts
    await account.execute([
      {
        contractAddress: KAKAROT_ADDRESS,
        calldata: [await dualVmToken.getAddress(), true],
        entrypoint: "set_authorized_cairo_precompile_caller",
      },
    ]);
    return dualVmToken;
  };

  this.beforeAll(async function () {
    try {
      [owner, addr1, addr2] = await hre.ethers.getSigners();

      // Pre-compute the StarkNet address of the ETH-side owner
      // to mint him the initial supply of the token
      ownerStarknet = await computeStarknetAddress(owner.address);

      // Send eth to addr1 and addr2, effectively deploying the underlying EOA accounts
      await owner
        .sendTransaction({
          to: addr1.address,
          value: parseEther("0.1"),
        })
        .then((tx) => tx.wait());
      await owner
        .sendTransaction({
          to: addr2.address,
          value: parseEther("0.1"),
        })
        .then((tx) => tx.wait());

      /** Deploy the contract */
      // Deploy the starknetToken
      console.log("deploy token class hash");

      ddToken = await account.declareAndDeploy({
        contract: starknetTokenSierra,
        casm: starknetTokenCasm,
        constructorCalldata: [
          cairo.felt("USDC token"),
          cairo.felt("USDC"),
          cairo.uint256(1_000_000),
          ownerStarknet,
          18,
        ],
      });

      starknetToken = new StarknetContract(
        starknetTokenSierra.abi,
        ddToken.deploy.contract_address,
        account
      );

      DualVMTokenFactory = await hre.ethers.getContractFactory("DualVMToken");
      dualVmQuoteToken = await deployDualVmToken(starknetToken.address);

      // Deploy the starknetLaunchpad
      console.log("deploy launchpad");

      dd = await account.declareAndDeploy({
        contract: starknetLaunchpadSierra,
        casm: starknetLaunchpadCasm,
        constructorCalldata: [
          ownerStarknet,
          initialKeyPrice,
          starknetToken.address,
          stepIncreaseLinear,
          ddToken.declare.class_hash,
          thresholdLiquidity,
          thresholdMarketcap,
        ],
      });

      starknetLaunchpad = new StarknetContract(
        starknetLaunchpadSierra.abi,
        dd.deploy.contract_address,
        account
      );

      // Deploy the pumpVM contract
      console.log("deploy sol dual vm launchpad");

      const pumpVMFactory = await hre.ethers.getContractFactory(
        "LaunchpadPumpDualVM"
      );
      pumpVM = await pumpVMFactory
        .deploy(KAKAROT_ADDRESS, starknetLaunchpad.address)
        .then((c) => c.waitForDeployment());

      // Whitelist the DualVMLaunchpad contract to call Cairo contracts
      await account.execute([
        {
          contractAddress: KAKAROT_ADDRESS,
          calldata: [await pumpVM.getAddress(), true],
          entrypoint: "set_authorized_cairo_precompile_caller",
        },
      ]);
      // fund addr1 with the dualVmQuoteToken
      await dualVmQuoteToken
        .transfer(addr1.address, 1000n)
        .then((tx) => tx.wait());
    } catch (e) {
      console.log("error before all", e);
    }
  });

  describe("createToken", function () {
    it("should create token", async function () {
      const receipt = await pumpVM
        .createToken(
          owner.address,
          toBytes31("symbol1"),
          toBytes31("name1"),
          100_000_000n,
          toBytes31("salty1")
        )
        .then((tx) => tx.wait());
      if (!receipt) {
        expect.fail("Tx receipt not found");
      }
      const [createToken] = receipt.logs as EventLog[];
      const { caller, tokenAddress, symbol, name, initialSupply, totalSupply } =
        createToken.args.toObject() as {
          caller: string;
          tokenAddress: bigint;
          symbol: string;
          name: string;
          initialSupply: bigint;
          totalSupply: bigint;
        };
      const tokens = await pumpVM.getAllCoins();
      const token = tokens.find(
        ({ symbol }) => fromBytes31(symbol) === "symbol1"
      );
      if (!token) {
        expect.fail("Token not found");
      }
      expect({
        owner: token.owner,
        tokenAddress: token.tokenAddress,
        symbol: token.symbol,
        name: token.name,
        initialSupply: token.initialSupply,
        totalSupply: token.totalSupply,
      }).to.include({
        owner: owner.address,
        tokenAddress,
        symbol: toBytes31("symbol1"),
        name: toBytes31("name1"),
        initialSupply: 100_000_000n,
        totalSupply: 100_000_000n,
      });
      expect({
        caller,
        tokenAddress,
        symbol,
        name,
        initialSupply,
        totalSupply,
      }).to.include({
        caller: owner.address,
        tokenAddress: token.tokenAddress,
        symbol: toBytes31("symbol1"),
        name: toBytes31("name1"),
        initialSupply: 100_000_000n,
        totalSupply: 100_000_000n,
      });
    });
  });

  describe("createAndLaunchToken", function () {
    it("should create token and launch pool", async function () {
      const receipt = await pumpVM
        .createAndLaunchToken(
          toBytes31("symbol2"),
          toBytes31("name2"),
          100_000_000n,
          toBytes31("salty2")
        )
        .then((tx) => tx.wait());
      if (!receipt) {
        expect.fail("Tx receipt not found");
      }
      const [, createLaunch] = receipt.logs as EventLog[];
      const {
        caller,
        tokenAddress,
        quoteTokenAddress,
        amount,
        price,
        totalSupply,
        slope,
        thresholdLiquidity,
      } = createLaunch.args.toObject() as {
        caller: string;
        tokenAddress: bigint;
        quoteTokenAddress: bigint;
        amount: bigint;
        price: bigint;
        totalSupply: bigint;
        slope: bigint;
        thresholdLiquidity: bigint;
      };
      const starknetTokenLaunch = await starknetLaunchpad.call(
        "get_coin_launch",
        [tokenAddress]
      );
      const tokenLaunch = await pumpVM.getCoinLaunch(tokenAddress);
      expect(starknetTokenLaunch).to.deep.include({
        owner: await computeStarknetAddress(tokenLaunch.owner),
        token_address: tokenLaunch.tokenAddress,
        initial_key_price: tokenLaunch.initialKeyPrice,
        price: tokenLaunch.price,
        available_supply: tokenLaunch.availableSupply,
        initial_pool_supply: tokenLaunch.initialPoolSupply,
        total_supply: tokenLaunch.totalSupply,
        created_at: tokenLaunch.createdAt,
        token_quote: {
          token_address: tokenLaunch.tokenQuote.tokenAddress,
          initial_key_price: tokenLaunch.tokenQuote.initialKeyPrice,
          price: tokenLaunch.tokenQuote.price,
          step_increase_linear: tokenLaunch.tokenQuote.stepIncreaseLinear,
          is_enable: tokenLaunch.tokenQuote.isEnable,
        },
        liquidity_raised: tokenLaunch.liquidityRaised,
        token_holded: tokenLaunch.tokenHolded,
        is_liquidity_launch: tokenLaunch.isLiquidityLaunch,
        slope: tokenLaunch.slope,
        threshold_liquidity: tokenLaunch.thresholdLiquidity,
      });
      expect({
        caller,
        tokenAddress,
        quoteTokenAddress,
        amount,
        price,
        totalSupply,
        slope,
        thresholdLiquidity,
      }).to.include({
        caller: owner.address,
        tokenAddress: tokenLaunch.tokenAddress,
        quoteTokenAddress: tokenLaunch.tokenQuote.tokenAddress,
        amount: 0n,
        price: tokenLaunch.initialKeyPrice,
        totalSupply: tokenLaunch.totalSupply,
        slope: tokenLaunch.slope,
        thresholdLiquidity: tokenLaunch.thresholdLiquidity,
      });
    });
  });

  describe("launchToken", function () {
    it("should launch token", async function () {
      const createTokenReceipt = await pumpVM
        .createToken(
          owner.address,
          toBytes31("symbol3"),
          toBytes31("name3"),
          100_000_000n,
          toBytes31("salty3")
        )
        .then((tx) => tx.wait());
      if (!createTokenReceipt) {
        expect.fail("Tx receipt not found");
      }
      const [createToken] = createTokenReceipt.logs as EventLog[];
      const { tokenAddress } = createToken.args.toObject() as {
        tokenAddress: bigint;
      };
      const dualVmToken = await deployDualVmToken(
        `0x${tokenAddress.toString(16)}`
      );
      await dualVmToken.starknetApprove(
        starknetLaunchpad.address,
        100_000_000n
      );
      const launchTokenReceipt = await pumpVM
        .launchToken(tokenAddress)
        .then((tx) => tx.wait());
      if (!launchTokenReceipt) {
        expect.fail("Tx receipt not found");
      }
      const [createLaunch] = launchTokenReceipt.logs as EventLog[];
      const {
        caller,
        quoteTokenAddress,
        amount,
        price,
        totalSupply,
        slope,
        thresholdLiquidity,
      } = createLaunch.args.toObject() as {
        caller: string;
        quoteTokenAddress: bigint;
        amount: bigint;
        price: bigint;
        totalSupply: bigint;
        slope: bigint;
        thresholdLiquidity: bigint;
      };
      const tokenLaunch = await pumpVM.getCoinLaunch(tokenAddress);
      expect({
        caller,
        tokenAddress,
        quoteTokenAddress,
        amount,
        price,
        totalSupply,
        slope,
        thresholdLiquidity,
      }).to.include({
        caller: owner.address,
        tokenAddress: tokenLaunch.tokenAddress,
        quoteTokenAddress: tokenLaunch.tokenQuote.tokenAddress,
        amount: 0n,
        price: tokenLaunch.initialKeyPrice,
        totalSupply: tokenLaunch.totalSupply,
        slope: tokenLaunch.slope,
        thresholdLiquidity: tokenLaunch.thresholdLiquidity,
      });
    });
  });

  describe("buyCoinByQuoteAmount", function () {
    it("buy coin with address and quote amount", async function () {
      const receipt = await pumpVM
        .createAndLaunchToken(
          toBytes31("symbol4"),
          toBytes31("name4"),
          100_000_000n,
          toBytes31("salty4")
        )
        .then((tx) => tx.wait());
      if (!receipt) {
        expect.fail("Tx receipt not found");
      }
      const [createToken] = receipt.logs as EventLog[];
      const { tokenAddress } = createToken.args.toObject() as {
        tokenAddress: bigint;
      };
      const dualVmToken = await deployDualVmToken(
        `0x${tokenAddress.toString(16)}`
      );
      await dualVmQuoteToken
        .connect(addr1)
        .starknetApprove(starknetLaunchpad.address, 1000n)
        .then((tx) => tx.wait());
      const buyerQuoteTokenBalanceBeforeBuy = await dualVmQuoteToken.balanceOf(
        addr1.address
      );
      const buyerTokenBalanceBeforeBuy = await dualVmToken.balanceOf(
        addr1.address
      );
      await pumpVM
        .connect(addr1)
        .buyTokenByQuoteAmount(tokenAddress, 100n)
        .then((tx) => tx.wait());
      const buyerQuoteTokenBalanceAfterBuy = await dualVmQuoteToken.balanceOf(
        addr1.address
      );
      const buyerTokenBalanceAfterBuy = await dualVmToken.balanceOf(
        addr1.address
      );
      expect(Number(buyerQuoteTokenBalanceBeforeBuy)).to.be.greaterThanOrEqual(
        Number(buyerQuoteTokenBalanceAfterBuy)
      );
      expect(Number(buyerTokenBalanceBeforeBuy)).to.be.lessThanOrEqual(
        Number(buyerTokenBalanceAfterBuy)
      );
    });
  });

  describe("sellCoin", function () {
    it("should sell coin by quote amount", async function () {
      const receipt = await pumpVM
        .createAndLaunchToken(
          toBytes31("symbol5"),
          toBytes31("name5"),
          100_000_000n,
          toBytes31("salty5")
        )
        .then((tx) => tx.wait());
      if (!receipt) {
        expect.fail("Tx receipt not found");
      }
      const [createToken] = receipt.logs as EventLog[];
      const { tokenAddress } = createToken.args.toObject() as {
        tokenAddress: bigint;
      };
      const dualVmToken = await deployDualVmToken(
        `0x${tokenAddress.toString(16)}`
      );
      await dualVmQuoteToken
        .connect(addr1)
        .starknetApprove(starknetLaunchpad.address, 1000n)
        .then((tx) => tx.wait());
      await pumpVM
        .connect(addr1)
        .buyTokenByQuoteAmount(tokenAddress, 1n)
        .then((tx) => tx.wait());
      const sellerQuoteTokenBalanceBeforeSell =
        await dualVmQuoteToken.balanceOf(addr1.address);
      const sellerTokenBalanceBeforeSell = await dualVmToken.balanceOf(
        addr1.address
      );
      await pumpVM
        .connect(addr1)
        .sellToken(tokenAddress, 1n)
        .then((tx) => tx.wait());
      const sellerQuoteTokenBalanceAfterSell = await dualVmQuoteToken.balanceOf(
        addr1.address
      );
      const sellerTokenBalanceAfterSell = await dualVmToken.balanceOf(
        addr1.address
      );
      expect(Number(sellerQuoteTokenBalanceBeforeSell)).to.be.lessThanOrEqual(
        Number(sellerQuoteTokenBalanceAfterSell)
      );
      expect(Number(sellerTokenBalanceBeforeSell)).to.be.greaterThanOrEqual(
        Number(sellerTokenBalanceAfterSell)
      );
    });
  });

  describe("setToken", function () {
    it("should set the default quote token", async function () {
      const ddNewQuoteToken = await account.declareAndDeploy({
        contract: starknetTokenSierra,
        casm: starknetTokenCasm,
        constructorCalldata: [
          cairo.felt("EURe token"),
          cairo.felt("EURe"),
          cairo.uint256(100_000_000),
          ownerStarknet,
          18,
        ],
      });
      const newQuoteToken = new StarknetContract(
        starknetTokenSierra.abi,
        ddNewQuoteToken.deploy.contract_address,
        account
      );
      await pumpVM
        .setToken({
          tokenAddress: newQuoteToken.address,
          initialKeyPrice: 1n,
          price: 1n,
          stepIncreaseLinear: 1n,
          isEnable: true,
        })
        .then((tx) => tx.wait());
      const starknetDefaultToken = await starknetLaunchpad.call(
        "get_default_token"
      );
      const defaultToken = await pumpVM.getDefaultToken();
      expect(starknetDefaultToken).to.include({
        token_address: defaultToken.tokenAddress,
        initial_key_price: defaultToken.initialKeyPrice,
        price: defaultToken.price,
        step_increase_linear: defaultToken.stepIncreaseLinear,
        is_enable: defaultToken.isEnable,
      });
    });
  });
});
