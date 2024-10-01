import { constants } from "starknet";

export const ACCOUNT_TEST_PROFILE = {
  alice: {
    name: "alice.xyz",
    pubkey: "",
    strkKey: "",
    // nostrPk: "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc",
    nostrPublicKey:
      "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc",
    nostrPrivateKey:
      "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35",
    // contract:"0x261d2434b2583293b7dd2048cb9c0984e262ed0a3eb70a19ed4eac6defef8b1",
    contract:
      "0x65d17b5c8fca3da3c45a4b7a97007331d51860e6843094fa98040b3962b741b",
  },
  bob: {
    name: "afk.xyz",
    pubkey: "",
    strkKey: "",
    /** FIRST TEST */
    /*** Dummy data */
    nostrPrivateKey:
      "70aca2a9ab722bd56a9a1aadae7f39bc747c7d6735a04d677e0bc5dbefa71d47",
    nostrPublicKey:
      "d6f1cf53f9f52d876505164103b1e25811ec4226a17c7449576ea48b00578171",

    contract:
      "0x1b5f5bee60ce25d6979c5b88cfbb74ad1dae197dba11719b2e06a5efa7e666d",
  },
};

export const ESCROW_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee",
};

export const KEYS_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const NAMESPACE_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};
export const ERROR_MESSAGES = {
  EVENT_NOTE_INVALID: {
    label: "EVENT_NOTE_INVALID",
    message: "The note event provided is invalid",
  },
  ADDRESS_INVALID: {
    label: "ADDRESS_INVALID",
    message: "The address of the receiver or sender are invalid",
  },
  PAY_REQUEST_NOT_FOUND: {
    label: "PAY_REQUEST_NOT_FOUND",
    message: "The pay request content on the event note is not correct",
  },
};

export const TOKENS_ADDRESS = {
  SEPOLIA: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    // TEST: "0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4",

    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    USDC: "0x02f37c3e00e75ee4135b32bb60c37e0599af264076376a618f138d2f9929ac74",
    TEST: "0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4",
    BIG_TOKEN:
      "0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4",
  },
  [constants.StarknetChainId.SN_SEPOLIA]: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    USDC: "0x02f37c3e00e75ee4135b32bb60c37e0599af264076376a618f138d2f9929ac74",
    BIG_TOKEN:
      "0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4",
  },
  DEVNET: {
    ETH: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
    TEST: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  },
};

export const CLASS_HASH = {
  TOKEN: {
    [constants.StarknetChainId.SN_SEPOLIA]:
      "0x58daf8998746438d557781b7a9ec1fbda1252c47196f158dcce2df55682644a",
  },
};

export const JEDISWAP_V2_NFT_ROUTER = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x024fd9721eea36cf8cebc226fd9414057bbf895b47739822f849f622029f9399",
  [constants.StarknetChainId.SN_MAIN]: "",
};

export const JEDISWAP_V2_FACTORY = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x050d3df81b920d3e608c4f7aeb67945a830413f618a1cf486bdcce66a395109c",
  [constants.StarknetChainId.SN_MAIN]: "",
};

export const LAUNCHPAD_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: "",
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x5cf19613d54ae5e7c229c87cc26322f2ff6c473d2183723010676b8337c0af3",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x19084523bd7307c2169ee32a336be3f9d9eb6bf24197156cb6fc7a42feb7a5",
};
