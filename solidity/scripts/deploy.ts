import hre from "hardhat";
import StarknetMessagingModule from "../ignition/modules/starknetMessaging";
import L1KakarotMessagingModule from "../ignition/modules/L1KakarotMessaging";
import { getTestProvider, getTestAccount } from "./config";

const provider = getTestProvider();
const account = getTestAccount(provider);

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

async function main() {
  const { starknetMessaging } = await hre.ignition.deploy(
    StarknetMessagingModule
  );
  const starknetMessagingAddress = await starknetMessaging.getAddress();

  console.log(`StarknetMessaging deployed to: ${starknetMessagingAddress}.`);

  const { L1KakarotMessaging } = await hre.ignition.deploy(
    L1KakarotMessagingModule,
    { parameters: { L1KakarotMessaging: { starknetMessagingAddress } } }
  );

  const address = await L1KakarotMessaging.getAddress();

  await account.execute([
    {
      contractAddress: KAKAROT_ADDRESS,
      calldata: [address, true],
      entrypoint: "set_authorized_message_sender",
    },
  ]);

  console.log(
    `L1KakarotMessaging deployed to: ${address} and authorized for messages.`
  );
}

main().catch(console.error);
