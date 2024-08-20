import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";
dotenv.config();

const KAKAROT_ADDRESS = process.env.KAKAROT_ADDRESS || "";
if (KAKAROT_ADDRESS === "") {
  throw new Error("KAKAROT_ADDRESS is not set in .env");
}

const L1KakarotMessagingModule = buildModule("L1KakarotMessaging", (m) => {
  const kakarotAddress = m.getParameter("kakarotAddress_", KAKAROT_ADDRESS);
  const starknetMessaging_ = m.getParameter("starknetMessagingAddress");
  const L1KakarotMessaging = m.contract("L1KakarotMessaging", [
    starknetMessaging_,
    kakarotAddress,
  ]);

  return { L1KakarotMessaging };
});

export default L1KakarotMessagingModule;
