import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { EventLog, parseEther, ZeroAddress } from "ethers";
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
} from "starknet";
import { DepositEscrowNostr, DualVMToken } from "../typechain-types";
import { ACCOUNT_TEST_PROFILE } from "common";
import { finalizeEvent } from "nostr-tools";
import dotenv from "dotenv";
dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

describe("TipNostr Test", function () {
  this.timeout(0);
  let tipNostr: DepositEscrowNostr;
  let owner: HardhatEthersSigner;
  let ownerStarknet: bigint;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const starknetDepositEscrowSierra = readContractSierra("DepositEscrow");
  const starknetDepositEscrowCasm = readContractSierraCasm("DepositEscrow");

  const provider = getTestProvider();
  const account = getTestAccount(provider);
  const starknetTokenSierra = readContractSierra("ERC20");
  const starknetTokenCasm = readContractSierraCasm("ERC20");
  let starknetToken: StarknetContract;
  let dualVMToken: DualVMToken;

  let dd: DeclareDeployUDCResponse;
  let ddToken: DeclareDeployUDCResponse;
  let starknetDeposit: StarknetContract;

  const computeStarknetAddress = async (evmAddress: string) => {
    const result = await account.callContract({
      contractAddress: KAKAROT_ADDRESS,
      calldata: [evmAddress],
      entrypoint: "compute_starknet_address",
    });
    return BigInt(result[0]);
  };

  const claimRequest = async (
    recipient: HardhatEthersSigner,
    nostrPublicKey: string,
    nostrPrivateKey: string,
    depositId: bigint,
    gasAmount: bigint
  ) => {
    // Start claim with Nostr event
    const recipientStarknetAddress = await computeStarknetAddress(
      recipient.address
    );
    const content = `claim: ${depositId},${recipientStarknetAddress},${BigInt(
      starknetToken.address
    ).toString()},${gasAmount}`;
    const timestamp = Date.now();
    //let privateKeyAlice = ACCOUNT_TEST_PROFILE?.alice?.nostrPrivateKey as any;
    //let privateKey = privateKeyAlice;
    // Sign Nostr event
    const event = finalizeEvent(
      {
        kind: 1,
        tags: [],
        content,
        created_at: timestamp,
      },
      ethers.getBytes(`0x${nostrPrivateKey}`)
    );
    return {
      publicKey: `0x${nostrPublicKey}`,
      createdAt: event.created_at,
      kind: event.kind,
      tags: ethers.toUtf8Bytes("[]"), // tags
      content: {
        depositId,
        recipient: recipient.address,
        gasTokenAddress: await dualVMToken.getAddress(),
        gasAmount,
      },
      sig: {
        r: `0x${event.sig.slice(0, event.sig.length / 2)}`,
        s: `0x${event.sig.slice(event.sig.length / 2)}`,
      },
    };
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
          cairo.felt("TEST_SYMBOL"),
          cairo.felt("TEST"),
          cairo.uint256(100_000_000),
          ownerStarknet,
          18,
        ],
      });
      starknetToken = new StarknetContract(
        starknetTokenSierra.abi,
        ddToken.deploy.contract_address,
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

      // Whitelist the Dual Token contract to call Cairo contracts
      await account.execute([
        {
          contractAddress: KAKAROT_ADDRESS,
          calldata: [await dualVMToken.getAddress(), true],
          entrypoint: "set_authorized_cairo_precompile_caller",
        },
      ]);

      // Deploy the starknetDeposit
      console.log("deploy deposit escrow");

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
      console.log("deploy solidity tip nostr");

      const tipNostrFactory = await hre.ethers.getContractFactory(
        "DepositEscrowNostr"
      );
      tipNostr = await tipNostrFactory
        .deploy(KAKAROT_ADDRESS, starknetDeposit.address)
        .then((c) => c.waitForDeployment());

      // Whitelist the DualVMLaunchpad contract to call Cairo contracts
      await account.execute([
        {
          contractAddress: KAKAROT_ADDRESS,
          calldata: [await tipNostr.getAddress(), true],
          entrypoint: "set_authorized_cairo_precompile_caller",
        },
      ]);

      // fund addr1 with the DualVmToken
      await dualVMToken
        .connect(owner)
        .transfer(addr1.address, 1000)
        .then((tx) => tx.wait());
    } catch (e) {
      console.error("error before all", e);
    }
  });

  describe("getDeposit", function () {
    it("should retrieve a deposit", async function () {
      const depositAmount = 100n;
      await dualVMToken
        .starknetApprove(starknetDeposit.address, depositAmount)
        .then((tx) => tx.wait());
      const result = await tipNostr
        .depositTo(
          depositAmount,
          await dualVMToken.getAddress(),
          BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
          0
        )
        .then((tx) => tx.wait());
      if (!result) {
        expect.fail("Tx receipt not found");
      }
      const [depositEvent] = result.logs as EventLog[];
      const { depositId } = depositEvent.args.toObject() as {
        depositId: bigint;
      };
      const starknetDepositResult = await starknetDeposit.call("get_deposit", [
        depositId,
      ]);
      const depositResult = await tipNostr.getDeposit(depositId);
      expect(starknetDepositResult).to.include({
        sender: await computeStarknetAddress(depositResult.sender),
        amount: depositResult.amount,
        token_address: BigInt(starknetToken.address),
        recipient: depositResult.nostrRecipient,
        ttl: depositResult.ttl,
      });
    });
    it("should return the default deposit when depositId is invalid", async function () {
      const { sender, amount, tokenAddress, nostrRecipient, ttl } =
        await tipNostr.getDeposit(0n);
      expect({ sender, amount, tokenAddress, nostrRecipient, ttl }).to.include({
        sender: ZeroAddress,
        amount: 0n,
        tokenAddress: ZeroAddress,
        nostrRecipient: 0n,
        ttl: 0n,
      });
    });
  });

  describe("depositTo", function () {
    it("should deposit to the escrow", async function () {
      const depositAmount = 100n;
      await dualVMToken
        .starknetApprove(starknetDeposit.address, depositAmount)
        .then((tx) => tx.wait());
      const senderBalanceBeforeDeposit = await dualVMToken.balanceOf(
        owner.address
      );
      await expect(
        tipNostr
          .depositTo(
            depositAmount,
            await dualVMToken.getAddress(),
            BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
            0n
          )
          .then((tx) => tx.wait())
      )
        .to.emit(tipNostr, "DepositEvent")
        .withArgs(
          2n,
          owner.address,
          BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
          depositAmount,
          await dualVMToken.getAddress()
        );
      const senderBalanceAfterDeposit = await dualVMToken.balanceOf(
        owner.address
      );
      expect(senderBalanceBeforeDeposit - depositAmount).to.equal(
        senderBalanceAfterDeposit,
        "sender amount to deposit not send"
      );
      // expect(
      //   await dualVMToken.starknetBalanceOf(starknetDeposit.address)
      // ).to.equal(amount, "escrow after deposit != amount");
    });
    it("should transfer directly to the recipient after initial successful claim", async function () {
      const depositAmount = 100n;
      const gasAmount = 0n;
      await dualVMToken
        .starknetApprove(starknetDeposit.address, depositAmount * 2n)
        .then((tx) => tx.wait());
      const result = await tipNostr
        .depositTo(
          depositAmount,
          await dualVMToken.getAddress(),
          BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
          0n
        )
        .then((tx) => tx.wait());
      if (!result) {
        expect.fail("Tx receipt not found");
      }
      const [depositEvent] = result.logs as EventLog[];
      const { depositId } = depositEvent.args.toObject() as {
        depositId: bigint;
      };
      const request = await claimRequest(
        addr1,
        ACCOUNT_TEST_PROFILE.alice.nostrPublicKey,
        ACCOUNT_TEST_PROFILE.alice.nostrPrivateKey,
        depositId,
        gasAmount
      );
      await tipNostr
        .connect(addr1)
        .claim(request, gasAmount)
        .then((tx) => tx.wait());
      await expect(
        tipNostr
          .depositTo(
            depositAmount,
            await dualVMToken.getAddress(),
            BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
            0n
          )
          .then((tx) => tx.wait())
      )
        .to.emit(tipNostr, "TransferEvent")
        .withArgs(
          owner.address,
          BigInt(`0x${ACCOUNT_TEST_PROFILE.alice.nostrPublicKey}`),
          addr1.address,
          depositAmount,
          await dualVMToken.getAddress()
        );
    });
  });

  describe("cancel", function () {
    it("should cancel a deposit", async function () {
      const depositAmount = 100n;
      await dualVMToken
        .starknetApprove(starknetDeposit.address, depositAmount)
        .then((tx) => tx.wait());
      const result = await tipNostr
        .depositTo(
          depositAmount,
          await dualVMToken.getAddress(),
          BigInt(`0x${ACCOUNT_TEST_PROFILE.bob.nostrPublicKey}`),
          0n
        )
        .then((tx) => tx.wait());
      if (!result) {
        expect.fail("Tx receipt not found");
      }
      const [depositEvent] = result.logs as EventLog[];
      const { depositId } = depositEvent.args.toObject() as {
        depositId: bigint;
      };
      await expect(tipNostr.cancel(depositId).then((tx) => tx.wait()))
        .to.emit(tipNostr, "CancelEvent")
        .withArgs(
          depositId,
          owner.address,
          BigInt(`0x${ACCOUNT_TEST_PROFILE.bob.nostrPublicKey}`),
          depositAmount,
          await dualVMToken.getAddress()
        );
      const { sender, amount, tokenAddress, nostrRecipient, ttl } =
        await tipNostr.getDeposit(depositId);
      expect({ sender, amount, tokenAddress, nostrRecipient, ttl }).to.include({
        sender: ZeroAddress,
        amount: 0n,
        tokenAddress: ZeroAddress,
        nostrRecipient: 0n,
        ttl: 0n,
      });
    });
  });

  describe("claim", function () {
    it("should claim a deposit", async function () {
      const depositAmount = 100n;
      const gasAmount = 0n;
      await dualVMToken
        .starknetApprove(starknetDeposit.address, depositAmount)
        .then((tx) => tx.wait());
      const senderBalanceBeforeDeposit = await dualVMToken.balanceOf(
        owner.address
      );
      const result = await tipNostr
        .depositTo(
          depositAmount,
          await dualVMToken.getAddress(),
          BigInt(`0x${ACCOUNT_TEST_PROFILE.bob.nostrPublicKey}`),
          0n
        )
        .then((tx) => tx.wait());
      if (!result) {
        expect.fail("Tx receipt not found");
      }
      const [depositEvent] = result.logs as EventLog[];
      const { depositId } = depositEvent.args.toObject() as {
        depositId: bigint;
      };
      const senderBalanceAfterDeposit = await dualVMToken.balanceOf(
        owner.address
      );
      // const escrowBalanceBeforeClaim = await dualVMToken.starknetBalanceOf(
      //   starknetDeposit.address
      // );
      const recipientBalanceBeforeClaim = await dualVMToken.balanceOf(
        addr2.address
      );
      const request = await claimRequest(
        addr2,
        ACCOUNT_TEST_PROFILE.bob.nostrPublicKey,
        ACCOUNT_TEST_PROFILE.bob.nostrPrivateKey,
        depositId,
        gasAmount
      );
      await expect(
        tipNostr
          .connect(addr2)
          .claim(request, gasAmount)
          .then((tx) => tx.wait())
      )
        .to.emit(tipNostr, "ClaimEvent")
        .withArgs(
          depositId,
          addr2.address,
          request.publicKey,
          request.content.recipient,
          depositAmount,
          await dualVMToken.getAddress(),
          request.content.gasTokenAddress,
          request.content.gasAmount
        );
      // sender check
      expect(senderBalanceBeforeDeposit - depositAmount).to.equal(
        senderBalanceAfterDeposit,
        "sender amount to deposit not send"
      );
      // recipient check
      const recipientBalanceAfterClaim = await dualVMToken.balanceOf(
        addr2.address
      );
      expect(recipientBalanceBeforeClaim).to.equal(
        0n,
        "recipient balance before claim != 0"
      );
      expect(recipientBalanceAfterClaim).to.equal(
        depositAmount,
        "recipient balance after claim != amount"
      );
      // escrow balance
      // expect(escrowBalanceBeforeClaim).to.equal(
      //   amount,
      //   "escrow before claim != amount"
      // );
      // const escrowBalanceAfterClaim = await dualVMToken.starknetBalanceOf(
      //   starknetDeposit.address
      // );
      // expect(escrowBalanceAfterClaim).to.equal(
      //   0n,
      //   "escrow balance after claim != 0"
      // );
    });
  });
});
