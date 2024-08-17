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
import { DualVMToken } from "../typechain-types";
dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("DualVMToken", function () {
  let dualVMToken: DualVMToken;
  let owner: HardhatEthersSigner;
  let ownerStarknet: string;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const starknetTokenSierra = readContractSierra("DualVmToken");
  const starknetTokenCasm = readContractSierraCasm("DualVmToken");

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  let dd: DeclareDeployUDCResponse;
  let starknetToken: StarknetContract;

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
      constructorCalldata: [100_000_000, 0, ownerStarknet],
    });

    starknetToken = new StarknetContract(
      starknetTokenSierra.abi,
      dd.deploy.contract_address,
      account
    );

    // Deploy the DualVMToken contract
    const DualVMTokenFactory = await hre.ethers.getContractFactory(
      "DualVMToken"
    );
    dualVMToken = await DualVMTokenFactory.deploy(
      KAKAROT_ADDRESS,
      starknetToken.address
    ).then((c) => c.waitForDeployment());

    // Whitelist the DualVMToken contract to call Cairo contracts
    await account.execute([
      {
        contractAddress: KAKAROT_ADDRESS,
        calldata: [await dualVMToken.getAddress(), true],
        entrypoint: "set_authorized_cairo_precompile_caller",
      },
    ]);

    // fund address 1 with the DualVmToken
    await dualVMToken.connect(owner).transfer(addr1.address, 1000);
  });

  describe("Metadata", function () {
    it("Should get the Cairo name", async function () {
      expect(await dualVMToken.name()).to.equal(
        await starknetToken.call("name")
      );
    });

    it("Should get the Cairo symbol", async function () {
      expect(await dualVMToken.symbol()).to.equal(
        await starknetToken.call("symbol")
      );
    });

    it("Should get the Cairo decimals", async function () {
      expect(await dualVMToken.decimals()).to.equal(
        await starknetToken.call("decimals")
      );
    });
  });

  describe("ERC20 storage", function () {
    it("Should get the total supply", async function () {
      expect(await dualVMToken.totalSupply()).to.equal(
        await starknetToken.call("total_supply")
      );
    });

    it("Should get balanceOf owner", async function () {
      expect(await dualVMToken.balanceOf(addr1.address)).to.equal(1000n);
    });

    it("Should get allowance", async function () {
      expect(
        await dualVMToken.allowance(addr1.address, addr2.address)
      ).to.equal(
        await starknetToken.call("allowance", [addr1.address, addr2.address])
      );
    });
  });

  describe("Logic", function () {
    it("Should approve", async function () {
      await dualVMToken
        .connect(addr1)
        .approve(addr2.address, 100)
        .then((tx) => tx.wait());
      expect(
        await dualVMToken.allowance(await addr1.address, addr2.address)
      ).to.equal(100);
    });

    it("Should transfer", async function () {
      const preBalance2 = await dualVMToken.balanceOf(addr2.address);

      await dualVMToken
        .connect(addr1)
        .transfer(addr2.address, 100n)
        .then((tx) => tx.wait());
      expect(await dualVMToken.balanceOf(addr2.address)).to.equal(
        preBalance2 + 100n
      );
    });

    it("Should transferFrom", async function () {
      await dualVMToken
        .connect(addr1)
        .approve(addr2.address, 100)
        .then((tx) => tx.wait());
      const preBalance2 = await dualVMToken.balanceOf(addr2.address);

      await dualVMToken
        .connect(addr2)
        .transferFrom(addr1.address, addr2.address, 100)
        .then((tx) => tx.wait());

      expect(await dualVMToken.balanceOf(addr2.address)).to.equal(
        preBalance2 + 100n
      );
    });
  });
});
