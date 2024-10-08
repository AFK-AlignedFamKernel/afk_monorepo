import { constants } from "starknet";

export const ESCROW_ADDRESSES = {
  [constants.StarknetChainId.SN_MAIN]: "", // TODO: Add mainnet escrow address

  // AFK Escrow
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x078a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263',

  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee",

  // [constants.StarknetChainId.SN_SEPOLIA]: "0x854a13df46ddc497f610a5bf65097650b0883ce99b6bae614294ecbaf1000d"
};

export const KEYS_ADDRESS = {
  // Old one
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1',

  /** NEW KEY MARKETPLACE */
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x70a168bae281a7eb0cdcb8c2c8c5708e180ae4c62ff46a4f7cb005fa634cb61",

  [constants.StarknetChainId.SN_MAIN]: "",
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const UNRUGGABLE_FACTORY_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1",
  [constants.StarknetChainId.SN_MAIN]:
    "0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc",

  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const NAMESPACE_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x6e8ecfa6872bd27a7517077069b401a494687e66e2a98d37311eee1d96f1b57",
  [constants.StarknetChainId.SN_MAIN]: "",
};

export const LAUNCHPAD_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: "",
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x5cf19613d54ae5e7c229c87cc26322f2ff6c473d2183723010676b8337c0af3",
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x19084523bd7307c2169ee32a336be3f9d9eb6bf24197156cb6fc7a42feb7a5"
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x29a532e6933a6d6f9939e59469d96b52b7c38561745331302e1a29f035e4dd0",
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x3798921000573bfc442d8153fc088db97bd3794f5ed19ea8c0846db5378f4af",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x595d9c14d5b52bae1bd5a88f3aefb521eca956fde4de95e400197f1080fa862",
};

export const ESCROW_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee",
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

  KAKAROT: {
    [constants.StarknetChainId.SN_SEPOLIA]: {
      ETH: "0x761612F0C8bdf8cF10e6F10045E2Ca7cbffBa8A3",
      USDc: "0x1B4C0bc8703D3af59322849bE01559fdb920c904",
      USDt: "0x2BF1004D9e80ca087BD1e089d75bc8c471995aC1",
    },
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

export const ART_PEACE_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e",
};
