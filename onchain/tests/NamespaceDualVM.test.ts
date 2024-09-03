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
  DeclareDeployUDCResponse,
  Contract as StarknetContract,
} from "starknet";
import { DualVMToken, NamespaceNostr } from "../typechain-types";
import { ACCOUNT_TEST_PROFILE } from "common";

dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("NamespaceDualVM", function () {
  this.timeout(0);
  let namespace: NamespaceNostr;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  // let dualVMToken: DualVMToken;


  // Nostr account
  let privateKeyAlice = ACCOUNT_TEST_PROFILE?.alice?.nostrPrivateKey as any;
  const alicePublicKey = ACCOUNT_TEST_PROFILE?.alice?.nostrPublicKey;
  
  let alicePublicKeyUint256= BigInt("0x" + alicePublicKey)


  const starknetNamespaceSierra = readContractSierra("Namespace");
  const starknetLaunchpadCasm = readContractSierraCasm("Namespace");

  const starknetTokenSierra = readContractSierra("ERC20");
  const starknetTokenCasm = readContractSierraCasm("ERC20");
  let starknetToken: StarknetContract;

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let ddToken: DeclareDeployUDCResponse;
  let starknetNamespace: StarknetContract;

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
     


      // Deploy the Nostr namespace
      console.log("deploy namespace nostr")

      dd = await account.declareAndDeploy({
        contract: starknetNamespaceSierra,
        casm: starknetLaunchpadCasm,
        constructorCalldata: [
          ownerStarknet,
          
        ],
      });

      starknetNamespace = new StarknetContract(
        starknetNamespaceSierra.abi,
        dd.deploy.contract_address,
        account
      );

      // Deploy the namespace contract
      console.log("deploy sol dual vm launchpad")

      const namespaceFactory = await hre.ethers.getContractFactory(
        "NamespaceNostr"
      );
      namespace = await namespaceFactory.deploy(
        KAKAROT_ADDRESS,
        starknetNamespace.address
      ).then((c) => c.waitForDeployment());

      // Whitelist the DualVMLaunchpad contract to call Cairo contracts
      await account.execute([
        {
          contractAddress: KAKAROT_ADDRESS,
          calldata: [await namespace.getAddress(), true],
          entrypoint: "set_authorized_cairo_precompile_caller",
        },
      ]);

       // console.log("deploy token class hash")

      // ddToken = await account.declareAndDeploy({
      //   contract: starknetTokenSierra,
      //   casm: starknetTokenCasm,
      //   constructorCalldata: [
      //     cairo.felt("TEST_SYMBOL"),
      //     cairo.felt("TEST"),
      //     cairo.uint256(100_000_000), 
      //     ownerStarknet,
      //     18
      //   ],
      // });
      // starknetToken = new StarknetContract(
      //   starknetTokenSierra.abi,
      //   ddToken.deploy.contract_address,
      //   account
      // );

    } catch (e) {
      console.log("error before all", e)
    }


  });

  describe("Get Nostr address of a Starknet user", function () {
    it("Get Nostr address of a Starknet user", async function () {

      await namespace
        .connect(addr1)
        .getNostrAddressByStarknetAddress(
          addr2.address,
        )
        .then((tx) => tx.wait());

    })
  })

  describe("Get Starknet address", function () {
    it("Get Starknet address by Nostr user" , async function () {

      await namespace
        .connect(addr1)
        .getStarknetAddressByNostrAddress(
          alicePublicKeyUint256
        )
        .then((tx) => tx.wait());

    })
  })



});
