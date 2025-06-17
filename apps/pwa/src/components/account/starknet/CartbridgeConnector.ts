import { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { ControllerOptions } from "@cartridge/controller";
import ColorMode from "@cartridge/controller";
import SessionPolicies from "@cartridge/controller";
import { constants } from "starknet";
import { LAUNCHPAD_ADDRESS } from "common";

const CONTRACT_ADDRESS_GAME = LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

// const policies: SessionPolicies = {
//   contracts: {
//     [CONTRACT_ADDRESS_GAME]: {
//       methods: [],
//     },
//   },
// };

// Controller basic configuration
// const colorMode: ColorMode = "dark";
// const theme = "aqua-stark";

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
  ],
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
//   policies,
//   theme,
//   colorMode,
//   namespace: "afk",
//   slot: "afk",
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;