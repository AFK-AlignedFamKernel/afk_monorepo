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
  uint256,
} from "starknet";
import { DualVMToken, LaunchpadPumpDualVM, TipNostr } from "../typechain-types";
import { formatFloatToUint256, LAUNCHPAD_ADDRESS, CLASS_HASH, TOKENS_ADDRESS, ACCOUNT_TEST_PROFILE } from "common";
import { finalizeEvent } from "nostr-tools"
dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("TipNostr", function () {
  this.timeout(0);
  let tipNostr: TipNostr;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let dualVMToken: DualVMToken;


  const starknetDepositEscrowSierra = readContractSierra("DepositEscrow");
  const starknetDepositEscrowCasm = readContractSierraCasm("DepositEscrow");

  const starknetTokenSierra = readContractSierra("ERC20");
  const starknetTokenCasm = readContractSierraCasm("ERC20");
  let starknetToken: StarknetContract;

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let ddToken: DeclareDeployUDCResponse;
  let starknetDeposit: StarknetContract;

  const TOKEN_QUOTE_ADDRESS = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH;

  // Nostr account
  let privateKeyAlice = ACCOUNT_TEST_PROFILE?.alice?.nostrPrivateKey as any;
  const alicePublicKey = ACCOUNT_TEST_PROFILE?.alice?.nostrPublicKey;
  let alicePublicKeyUint256 = BigInt("0x" + alicePublicKey)

  this.beforeAll(async function () {
    try {
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


      /** Deploy the contract */
      // Deploy the starknetToken
      // console.log("deploy token class hash")
      // ddToken = await account.declareAndDeploy({
      //   contract: starknetTokenSierra,
      //   casm: starknetTokenCasm,
      //   constructorCalldata: [
      //     cairo.felt("TEST_SYMBOL"),
      //     cairo.felt("TEST"),
      //     cairo.uint256(100_000_000),
      //     ownerStarknet,
      //     18],
      // });
      // ddToken = await account.declareAndDeploy({
      //   contract: starknetTokenSierra,
      //   casm: starknetTokenCasm,
      //   constructorCalldata: [100_000_000, 0, ownerStarknet],
      // });
      // starknetToken = new StarknetContract(
      //   starknetTokenSierra.abi,
      //   ddToken.deploy.contract_address,
      //   account
      // );

      // Deploy the starknetDeposit
      console.log("deploy deposit escrow")

      dd = await account.declareAndDeploy({
        contract: starknetDepositEscrowSierra,
        casm: starknetDepositEscrowCasm,
        constructorCalldata: [],
      });

      starknetDeposit = new StarknetContract(
        starknetDepositEscrowSierra.abi,
        dd.deploy.contract_address,
        account
      );

      // Deploy the tipNostr contract
      console.log("deploy solidity tip nostr")

      const tipNostrFactory = await hre.ethers.getContractFactory(
        "TipNostr"
      );
      tipNostr = await tipNostrFactory.deploy(
        KAKAROT_ADDRESS,
        starknetDeposit.address
      ).then((c) => c.waitForDeployment());

      // Whitelist the DualVMLaunchpad contract to call Cairo contracts
      await account.execute([
        {
          contractAddress: KAKAROT_ADDRESS,
          calldata: [await tipNostr.getAddress(), true],
          entrypoint: "set_authorized_cairo_precompile_caller",
        },
      ]);

    } catch (e) {
      console.log("error before all", e)
    }


  });

  describe("depositTo", function () {
    it("Should deposit to a Nostr user", async function () {

      await tipNostr
        .connect(addr1)
        .depositTo(
          1n,
          TOKEN_QUOTE_ADDRESS,
          alicePublicKeyUint256,
          0
        )
        .then((tx) => tx.wait());
    })
  })

  describe("claim", function () {
    it("Should deposit to a Nostr user", async function () {

      await tipNostr
        .connect(addr1)
        .depositTo(
          1,
          TOKEN_QUOTE_ADDRESS,
          alicePublicKeyUint256,
          0
        )
        .then((tx) => tx.wait());


      /** Start claim with Nostr event */

      const content = `claim: ${cairo.felt(0)},${cairo.felt(
        ownerStarknet!,
      )},${cairo.felt(TOKEN_QUOTE_ADDRESS)},${BigInt(1).toString()}`;


      const timestamp = new Date().getTime()


      let privateKeyAlice = ACCOUNT_TEST_PROFILE?.alice?.nostrPrivateKey as any;
      let privateKey = privateKeyAlice

      // Sign Nostr event
      const event = finalizeEvent(
        {
          kind: 1,
          tags: [],
          content: content,
          created_at: timestamp,
        },
        privateKey
      );

      console.log(
        "event",
        event
      );
      const signature = event.sig;
      const signatureR = "0x" + signature.slice(0, signature.length / 2);
      const signatureS = "0x" + signature.slice(signature.length / 2);
      console.log("signature", signature);
      console.log("signatureR", signatureR);
      console.log("signatureS", signatureS);
      let public_key = BigInt("0x" + alicePublicKey)


      /** @TODO fix conversion */
      const claimParams = {
        public_key: public_key,
        created_at: new Date().getTime(),
        kind: 1,
        tags: ethers.toUtf8Bytes("[]"), // tags
        // tags: byteArray.byteArrayFromString("[]"), // tags
        // content: content, // currentId in felt
        // content: cairo.felt(depositId),
        content: {
          deposit_id: ethers.toUtf8Bytes("0").slice(0,31),
          starknet_recipient: ownerStarknet,
          gas_token_address: TOKEN_QUOTE_ADDRESS,
          gas_amount:BigInt(0),
        },
        sig: {
          r: signatureR,
          s: signatureS
        },
      };

      await tipNostr
        .connect(addr1)
        .claim(
          claimParams,
          // 1n,
        )
        .then((tx) => tx.wait());
    })
  })


});
