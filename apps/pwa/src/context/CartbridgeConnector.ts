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


// const cartridgeConnector = new ControllerConnector({
//   url: cartridgeProvider()?.nodeUrl ?? 'https://api.cartridge.gg/x/starknet/sepolia',
//   // url: 'https://api.cartridge.gg/x/starknet/sepolia',
//   defaultChainId: CHAIN_ID,
//   chains: [
//     {
//       rpcUrl: cartridgeProvider()?.nodeUrl ?? 'https://api.cartridge.gg/x/starknet/sepolia',
//     },
//   ],
// });

// const cartridgeConnector = new ControllerConnector({
//   url: 'https://api.cartridge.gg/x/starknet/sepolia',
//   defaultChainId: CHAIN_ID,
//   chains: [
//     {
//       rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
//     },
//   ],
// });

export default cartridgeConnector;
