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
  let pumpVM: LaunchpadPumpDualVM;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const starknetTokenSierra = readContractSierra("LaunchpadMarketplace");
  const starknetTokenCasm = readContractSierraCasm("LaunchpadMarketplace");

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let starknetToken: StarknetContract;

  const initial_key_price = cairo.uint256(1);
  const step_increase_linear = cairo.uint256(1);

  /** TODO check correct format for uint256 */
  const threshold_liquidity_nb = 10;
  const threshold_liquidity = formatFloatToUint256(threshold_liquidity_nb)
  const threshold_marketcap_nb = 5000;
  const threshold_marketcap = formatFloatToUint256(threshold_marketcap_nb);
  // const threshold_marketcap = cairo.uint256(threshold_marketcap_nb);
  // const threshold_liquidity = cairo.uint256(threshold_liquidity_nb);
  const TOKEN_QUOTE_ADDRESS = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
  const TOKEN_CLASS_HASH = CLASS_HASH.TOKEN[constants.StarknetChainId.SN_SEPOLIA]


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

    // Deploy the starknetToken
    dd = await account.declareAndDeploy({
      contract: starknetTokenSierra,
      casm: starknetTokenCasm,
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

    starknetToken = new StarknetContract(
      starknetTokenSierra.abi,
      dd.deploy.contract_address,
      account
    );

    // Deploy the pumpVM contract
    const pumpVMFactory = await hre.ethers.getContractFactory(
      "LaunchpadPumpDualVM"
    );
    pumpVM = await pumpVMFactory.deploy(
      KAKAROT_ADDRESS,
      starknetToken.address
    ).then((c) => c.waitForDeployment());

    // Whitelist the DualVMToken contract to call Cairo contracts
    await account.execute([
      {
        contractAddress: KAKAROT_ADDRESS,
        calldata: [await pumpVM.getAddress(), true],
        entrypoint: "set_authorized_cairo_precompile_caller",
      },
    ]);

  });

});
