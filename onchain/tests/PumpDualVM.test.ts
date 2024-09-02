import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { parseEther, type Contract as EthContract, type Signer } from "ethers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-ethers";
import {
  readContractSierraCasm,
  readContractSierra,
  getTestProvider,
  getTestAccount,
} from "../scripts/config";
import dotenv from "dotenv";
import {
  byteArray,
  cairo,
  constants,
  DeclareDeployUDCResponse,
  Contract as StarknetContract,
} from "starknet";
import { LaunchpadPumpDualVM } from "../typechain-types";
import { formatFloatToUint256, LAUNCHPAD_ADDRESS, CLASS_HASH, TOKENS_ADDRESS } from "common";

dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("PumpDualVM", function () {
  this.timeout(0);
  let pumpVM: LaunchpadPumpDualVM;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const starknetLaunchpadSierra = readContractSierra("LaunchpadMarketplace");
  const starknetLaunchpadCasm = readContractSierraCasm("LaunchpadMarketplace");

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let starknetLaunchpad: StarknetContract;

  const initial_key_price = cairo.uint256(1);
  const step_increase_linear = cairo.uint256(1);

  /** TODO check correct format for uint256 */
  const name_token = cairo.felt("TEST");
  const symbol_token = cairo.felt("TEST_SYMBOL");
  const threshold_liquidity_nb = 10;
  const threshold_liquidity = formatFloatToUint256(threshold_liquidity_nb)
  const threshold_marketcap_nb = 5000;
  const threshold_marketcap = formatFloatToUint256(threshold_marketcap_nb);
  const init_supply_nb = 100_000_000;

  const init_supply = formatFloatToUint256(init_supply_nb);
  const init_supply_bn = ethers.toBigInt(init_supply_nb);
  // const threshold_marketcap = cairo.uint256(threshold_marketcap_nb);
  // const threshold_liquidity = cairo.uint256(threshold_liquidity_nb);
  const TOKEN_QUOTE_ADDRESS = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
  const TOKEN_CLASS_HASH = CLASS_HASH.TOKEN[constants.StarknetChainId.SN_SEPOLIA]

  const nameBytes = ethers.toUtf8Bytes(name_token)
  const symbolBytes = ethers.toUtf8Bytes(symbol_token)
  const timestampBytes = ethers.toUtf8Bytes(new Date().getTime().toString())

  this.beforeAll(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    // Pre-compute the StarkNet address of the ETH-side owner
    // to mint him the initial supply of the token
    ownerStarknet = (
      await account.callContract({
        contractAddress: KAKAROT_ADDRESS,
        calldata: [owner.address],
        entrypoint: "compute_starknet_address",
      })
    )[0];

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

    // Deploy the starknetLaunchpad
    console.log("deploy launchpad")

    dd = await account.declareAndDeploy({
      contract: starknetLaunchpadSierra,
      casm: starknetLaunchpadCasm,
      constructorCalldata: [
        ownerStarknet,
        initial_key_price,
        TOKEN_QUOTE_ADDRESS,
        step_increase_linear,
        TOKEN_CLASS_HASH,
        threshold_liquidity,
        threshold_marketcap
      ],
    });

    starknetLaunchpad = new StarknetContract(
      starknetLaunchpadSierra.abi,
      dd.deploy.contract_address,
      account
    );

    // Deploy the pumpVM contract
    console.log("deploy sol dual vm launchpad")

    const pumpVMFactory = await hre.ethers.getContractFactory(
      "LaunchpadPumpDualVM"
    );
    pumpVM = await pumpVMFactory.deploy(
      KAKAROT_ADDRESS,
      starknetLaunchpad.address
    ).then((c) => c.waitForDeployment());

    // Whitelist the DualVMLaunchpad contract to call Cairo contracts
    await account.execute([
      {
        contractAddress: KAKAROT_ADDRESS,
        calldata: [await pumpVM.getAddress(), true],
        entrypoint: "set_authorized_cairo_precompile_caller",
      },
    ]);


  });


  describe("createToken", function () {
    it("Shouldd create token", async function () {
      await pumpVM
        .connect(addr1)
        .createToken(addr2.address,

          nameBytes,
          symbolBytes,
          init_supply_bn,
          timestampBytes,
        )
        .then((tx) => tx.wait());

    })

  })

  describe("createAndLaunchToken", function () {
    it("Shouldd create token and launch pool", async function () {
      await pumpVM
        .connect(addr1)
        .createAndLaunchToken(addr2.address,
          nameBytes,
          symbolBytes,
          init_supply_bn,
          timestampBytes
        )
        .then((tx) => tx.wait());
    })
  })


  describe("buyCoin", function () {
    it("Buy coin with address and quote amount", async function () {

    })
  })

});
