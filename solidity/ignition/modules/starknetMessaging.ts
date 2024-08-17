import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StarknetMessagingModule = buildModule("StarknetMessagingModule", (m) => {
  const starknetMessaging = m.contract("StarknetMessagingLocal");
  return { starknetMessaging };
});

export default StarknetMessagingModule;
