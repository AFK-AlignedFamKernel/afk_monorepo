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
  DeclareDeployUDCResponse,
  Contract as StarknetContract,
} from "starknet";
import { Namespace } from "../typechain-types";

dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("Namespace", function () {
  let namespace: Namespace;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const starknetNamespaceSierra = readContractSierra("Namespace");
  const starknetNamespaceCasm = readContractSierraCasm("Namespace");

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let starknetNamespace: StarknetContract;

  this.beforeAll(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    // Pre-compute the StarkNet address of the ETH-side owner
    ownerStarknet = (
      await account.callContract({
        contractAddress: KAKAROT_ADDRESS,
        calldata: [owner.address],
        entrypoint: "compute_starknet_address",
      })
    )[0];

    // Send ETH to addr1 and addr2
    await owner.sendTransaction({
      to: addr1.address,
      value: parseEther("0.1"),
    }).then((tx) => tx.wait());
    await owner.sendTransaction({
      to: addr2.address,
      value: parseEther("0.1"),
    }).then((tx) => tx.wait());

    // Deploy the Starknet Namespace contract
    dd = await account.declareAndDeploy({
      contract: starknetNamespaceSierra,
      casm: starknetNamespaceCasm,
      constructorCalldata: [0, ownerStarknet], // Modify based on actual constructor
    });

    starknetNamespace = new StarknetContract(
      starknetNamespaceSierra.abi,
      dd.deploy.contract_address,
      account
    );

    // Deploy the Namespace contract
    const NamespaceFactory = await hre.ethers.getContractFactory("Namespace");
    namespace = await NamespaceFactory.deploy(
      KAKAROT_ADDRESS,
      starknetNamespace.address
    ).then((c) => c.waitForDeployment());

    // Whitelist the Namespace contract to call Cairo contracts
    await account.execute([
      {
        contractAddress: KAKAROT_ADDRESS,
        calldata: [await namespace.getAddress(), true],
        entrypoint: "set_authorized_cairo_precompile_caller",
      },
    ]);

    // Link Nostr address to Starknet address
    await namespace.connect(owner).linkNostrAddress(1, ownerStarknet);
  });

  describe("Metadata", function () {
    it("Should get the Cairo Nostr address by Starknet address", async function () {
      expect(await namespace.getNostrAddressByStarknetAddress(ownerStarknet)).to.equal(1);
    });

    it("Should get the Cairo Starknet address by Nostr address", async function () {
      expect(await namespace.getStarknetAddressByNostrAddress(1)).to.equal(ownerStarknet);
    });
  });

  describe("Logic", function () {
    it("Should link Nostr address to Starknet address", async function () {
      await namespace.connect(owner).linkNostrAddress(2, addr1.address);

      // Verify linking
      expect(await namespace.getNostrAddressByStarknetAddress(addr1.address)).to.equal(2);
      expect(await namespace.getStarknetAddressByNostrAddress(2)).to.equal(addr1.address);
    });
  });
});
