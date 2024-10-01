import { provider } from "../utils/starknet";
import { Account, byteArray, cairo, constants, uint256 } from "starknet";
import dotenv from "dotenv";
import {
  cancel,
  claimDeposit,
  createEscrowAccount,
  deposit,
} from "../utils/escrow";
import { prepareAndConnectContract } from "../utils/token";
import { ACCOUNT_TEST_PROFILE, ESCROW_ADDRESS } from "../constants/index";
import { TOKENS_ADDRESS } from "../constants/index";
dotenv.config();
/** Testing tips flow:
 * Deploy contract
 * Deposit
 * Claim
 * Cancel
 */
// Sepolia params testing
const currentId = 1;
const idToClaim = 1;
const idToCancel = 1;
let escrow_address: string | undefined = ESCROW_ADDRESS[
  constants.StarknetChainId.SN_SEPOLIA
] as any; // change default address
let escrow_address_default: string = ESCROW_ADDRESS[
  constants.StarknetChainId.SN_SEPOLIA
] as any; // change default address
let token_used_address = TOKENS_ADDRESS.DEVNET.ETH;

describe("Escrow End to end test", function () {
  this.timeout(0); // Disable timeout for this test

  it("Deploy Escrow", async function () {
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");
    let escrow;
    if (process.env.IS_DEPLOY_CONTRACT == "true") {
      let escrowContract = await createEscrowAccount();

      console.log("escrow address", escrowContract?.contract_address);

      if (escrowContract?.contract_address) {
        escrow_address = escrowContract?.contract_address;
      }
      escrow = await prepareAndConnectContract(
        escrowContract?.contract_address ?? escrow_address_default, // uncomment if you recreate a contract
        account
      );
    } else {
      escrow = await prepareAndConnectContract(
        escrow_address ?? escrow_address_default,
        account
      );
    }
  });

  it("Deposit", async function () {
    this.timeout(0); // Disable timeout for this test
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");
    const alicePublicKey = ACCOUNT_TEST_PROFILE?.alice?.nostrPublicKey;

    let escrow = await prepareAndConnectContract(
      escrow_address ?? escrow_address_default,
      account
    );

    /** Send a note */
    let amount: number = 1;
    let strkToken = await prepareAndConnectContract(
      token_used_address,
      account
    );

    /** Deposit */
    let nextId = currentId; //  await escrow.get_next_deposit_id(); // function need to be made?
    console.log("nextId", nextId);

    let depositCurrentId = await escrow.get_deposit(currentId);
    console.log("depositCurrentId", depositCurrentId);
    console.log("try approve escrow erc20");
    let txApprove = await strkToken.approve(
      escrow?.address,
      cairo.uint256(amount) // change for decimals float => uint256.bnToUint256("0x"+alicePublicKey)
    );

    await account?.waitForTransaction(txApprove?.transaction_hash);
    // Need an approve before
    console.log("deposit amount");

    await deposit({
      escrow,
      amount,
      account,
      tokenAddress: strkToken?.address,
      timelock: 100,
      alicePublicKey: alicePublicKey,
    });
  });

  it("Claim", async function () {
    this.timeout(0); // Disable timeout for this test
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");
    let privateKeyAlice = ACCOUNT_TEST_PROFILE?.alice?.nostrPrivateKey as any;
    const alicePublicKey = ACCOUNT_TEST_PROFILE?.alice?.nostrPublicKey;

    let escrow = await prepareAndConnectContract(
      escrow_address ?? escrow_address_default,
      account
    );
    /** Claim */
    let timestamp = 1716285235;

    let depositToClaim = await escrow.get_deposit(idToClaim);
    console.log("deposit to claim", depositToClaim);

    let content = `claim ${cairo.felt(idToClaim)},${cairo.felt(
      accountAddress0!
    )},${cairo.felt(token_used_address)},${"0".toString()}`;
    let txClaim = await claimDeposit({
      escrow,
      account,
      depositId: idToClaim,
      content,
      timestamp,
      alicePublicKey,
      privateKey: privateKeyAlice,
      token_address_used: token_used_address,
      user_connected: accountAddress0,
    });
    console.log("tx claim", txClaim);
  });

  it("Cancel", async function () {
    this.timeout(0); // Disable timeout for this test
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");
    const alicePublicKey = ACCOUNT_TEST_PROFILE?.alice?.nostrPublicKey;

    let escrow = await prepareAndConnectContract(
      escrow_address ?? escrow_address_default,
      account
    );
    /** Deposit */
    let depositToCancel = await escrow.get_deposit(idToCancel);
    console.log("deposit to cancel", depositToCancel);
    await cancel({
      escrow,
      account,
      depositId: idToCancel,
    });
  });
});
