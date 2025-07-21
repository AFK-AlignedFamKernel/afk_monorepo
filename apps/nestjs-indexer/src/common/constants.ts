// import { NOSTR_FI_SCORING_ADDRESS } from "common";
// import { constants } from "starknet";

export default {
  DECIMALS: 18,
  STARTING_BLOCK: 900_000,
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
      // LAUNCHPAD_ADDRESS: "0x34e73d4ff75f922484a9208f506e9aa8acfdb333a648ca68cde276d83678aa9",
      // LAUNCHPAD_ADDRESS: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3",
      LAUNCHPAD_ADDRESS: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548",


      
      NAMESERVICE_ADDRESS:
        '0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f',
      // ESCROW_DEPOSIT_ADDRESS:
      //   '0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee',
      ESCROW_DEPOSIT_ADDRESS:
        '0x7b1cee9650c127b80067e02b6235a526e3c68ba0401460c3e5dcff58ddcd154',
        
      // NOSTRFI_SCORING_ADDRESS:
      //   NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string,
     
      // NAMESPACE_ADDRESS: "0x11596a9272e292d5cfd7a5adaa8056a966ee5e918b4415371248d494686105a"
      // NAMESPACE_ADDRESS: "0x4b200c273875161f856279d03c6feb2b84e4dc80421532c80e47a78f8ac2a3",

      NAMESPACE_ADDRESS: "0x07607c8A50b83938ea3f9DA25DC1b7024814C0E5bF4B40bF6D6FF9Bc7387aa7d",
      // NOSTRFI_SCORING_ADDRESS:
      // '0x2e6e0decf99cf883e9c72d22fa439ca0abbf4989c5f472901c4072a78d74c39',
      // NOSTRFI_SCORING_ADDRESS:
      // '0x58c016ef8fe64adb660b4b785fc35a4dd428781d63d8660a02ee2edcf457437',
      
      NOSTRFI_SCORING_ADDRESS:
      '0x1ac5004a5deb46fb23ca5a8821a9c156cad1b173ffd3c48e7a3151288d7c615',
    },
  },
  apibara: {
    MAX_RECEIVE_MESSAGE_LENGTH: 128 * 1_048_576,
  },
};
