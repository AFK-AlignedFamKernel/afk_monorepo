// import { NOSTR_FI_SCORING_ADDRESS } from "common";
// import { constants } from "starknet";

export default {
  DECIMALS: 18,
  STARTING_BLOCK: 450_000,
  STARTING_BLOCK_UNRUG: 615_556,
  STARTING_BLOCK_MAINNET: 615_556,
  networks: {
    mainnet: {
      name: 'mainnet',
    },
    sepolia: {
      name: 'sepolia',
    },
  },
  contracts: {
    mainnet: {
      FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
      UNRUGGABLE_FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
    },
    sepolia: {
      // LAUNCHPAD_ADDRESS:"0x6579503122e7564117f2192d6a66ec81b51dfd551b39a4fa26046044cd39a35",
      // LAUNCHPAD_ADDRESS:
      //   '0x4cefb7ab4c3fda72df52f288e141ff1dc6956a497949bf7b0031f012f3d3afc',
      // LAUNCHPAD_ADDRESS:
      //   '0x4a5d414ec6085ef5d3779b6e72015076b1a1ecdb6065fe1123d794ff41aea4d',
      // LAUNCHPAD_ADDRESS:
      //   '0x2b4d93fc565381d1911f3f449f615de050b72d297fc95d89dda0301d7d35a37',
      // LAUNCHPAD_ADDRESS:
      // '0x7fbf067657772a454c302354a19e07ce0a920736e2e3b7ca605d813723db883',
      // LAUNCHPAD_ADDRESS:"0x45cb52efdb2f80811c461f7115e550574739a6cd2725df759022899286b9dc1",
      LAUNCHPAD_ADDRESS: "0x14b92e6224ac3693ccc396e03744576d93be30daf3f29d92e5b1458b328e9dd",
      NAMESERVICE_ADDRESS:
        '0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f',
      ESCROW_DEPOSIT_ADDRESS:
        '0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee',
      // NOSTRFI_SCORING_ADDRESS:
      //   NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string,
      NOSTRFI_SCORING_ADDRESS:
        '0x2e6e0decf99cf883e9c72d22fa439ca0abbf4989c5f472901c4072a78d74c39',
      NAMESPACE_ADDRESS: "0x11596a9272e292d5cfd7a5adaa8056a966ee5e918b4415371248d494686105a"
    },
  },
  apibara: {
    MAX_RECEIVE_MESSAGE_LENGTH: 128 * 1_048_576,
  },
};
