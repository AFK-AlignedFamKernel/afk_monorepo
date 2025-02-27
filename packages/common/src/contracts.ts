import { constants } from "starknet";
import { mainnet, sepolia, kakarotSepolia } from 'viem/chains';

export const ESCROW_ADDRESSES = {
  [constants.StarknetChainId.SN_MAIN]: "", // TODO: Add mainnet escrow address

  // AFK Escrow
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x078a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263',

  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee",
  [constants.StarknetChainId.SN_SEPOLIA]: "0x1ed7f4d0afce7bd17acecae039f255724d194373f104ce04b3146d6461e09f",

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
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //  "0x4a5d414ec6085ef5d3779b6e72015076b1a1ecdb6065fe1123d794ff41aea4d",

  // old contract
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x7fbf067657772a454c302354a19e07ce0a920736e2e3b7ca605d813723db883"
  // new launchpad
  [constants.StarknetChainId.SN_SEPOLIA]: "0x45cb52efdb2f80811c461f7115e550574739a6cd2725df759022899286b9dc1",

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
  [sepolia.id]: {
    ETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  [kakarotSepolia.id]: {
    ETH: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
  },
  [mainnet.id]: {
    USDC: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  [constants.StarknetChainId.SN_MAIN]: {
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
    // [constants.StarknetChainId.SN_SEPOLIA]:
    // "0x142180837a41ad06cc36fbc8c449ba4516397b1a82f260c206afd3411e9fe0d",
    [constants.StarknetChainId.SN_SEPOLIA]:
      "0x43b100e1cd969dc45b1d59afcda47ee52444e5baba9ef511a16858d2067ecb7",

    // "0x58daf8998746438d557781b7a9ec1fbda1252c47196f158dcce2df55682644a",
    // "0x97341df71bdc18c3c1d9496a238f92b895c0c3d61725481641c851d3db0851",
    [constants.StarknetChainId.SN_MAIN]: ""
  },
  MEMECOIN: {
    // [constants.StarknetChainId.SN_SEPOLIA]:
    // "0x142180837a41ad06cc36fbc8c449ba4516397b1a82f260c206afd3411e9fe0d"
    [constants.StarknetChainId.SN_SEPOLIA]:
      "0x43b100e1cd969dc45b1d59afcda47ee52444e5baba9ef511a16858d2067ecb7",
    // "0x58daf8998746438d557781b7a9ec1fbda1252c47196f158dcce2df55682644a",
    // "0x97341df71bdc18c3c1d9496a238f92b895c0c3d61725481641c851d3db0851"
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
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x4a115963fd4ea03a0c187d87574924852184a6d6997f199ad050679af6c9653",

  // [constants.StarknetChainId.SN_SEPOLIA]:
  // "0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x1d3c8e4dcc100eb88e418d89a012326bd904fe5de061aee5df505a30d0ff5e9",


};

export const USERNAME_STORE_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x3af00ab1a4d280793d311c610173bdf84b6e2fd2221bacfc52d19531413e00c",
};

export const EKUBO_CORE = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x0444a09d96389aa7148f1aada508e30b71299ffe650d9c97fdaae38cb9a23384",
  [constants.StarknetChainId.SN_MAIN]: "0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b",
};

export const EKUBO_POSITION = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x06a2aee84bb0ed5dded4384ddd0e40e9c1372b818668375ab8e3ec08807417e5",
  [constants.StarknetChainId.SN_MAIN]: "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
};


export const EKUBO_DEX_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763",
  [constants.StarknetChainId.SN_MAIN]: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e",
};


export const EKUBO_REGISTRY = {
  // V2
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x0293c0d738eff5aa65619069d437eba2bcb320fb8003f37c9708afcdbe8739c8",
  [constants.StarknetChainId.SN_MAIN]: "0x0013e25867b6eef62703735aa4cfa7754e72f4e94a56c9d3d9ad8ebe86cee4aa",

  // V3 support bytearray
  // [constants.StarknetChainId.SN_SEPOLIA]:
  // "0x04484f91f0d2482bad844471ca8dc8e846d3a0211792322e72f21f0f44be63e5",
  // [constants.StarknetChainId.SN_MAIN]: "0x064bdb4094881140bc39340146c5fcc5a187a98aec5a53f448ac702e5de5067e",
};


export const NAMESERVICE_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: "",
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //  "0x4fe0ee38c814e0599a5140c5673a233d227ce0be9e22c3acdbee15ac9aefc10",

  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f",

};

export const UNRUGGABLE_LIQUIDITY_ADDRESSES = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0xe39ea1a892ea736b2720cae35186cec2961364e88de4c502d0c076da916305",
  [constants.StarknetChainId.SN_MAIN]:
    "0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc",
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x6e171a9e1efd2e15b77628377523e05afd91608f8c12aea2523a8c76c8ca695"
   [constants.StarknetChainId.SN_SEPOLIA]:
    "0x4025677f80126c5e171003a2cdf108e5a08d0cbf5dfbbfaab3e940fa4d4021"
};



export const DAO_FACTORY_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x67abfcaab98916c954c6a82260f61f566488dd72d94a6b1fb6be0cd2462703e",
  [constants.StarknetChainId.SN_MAIN]: "",
};




export const RPC_URLS_NUMBER: { [key: number]: string } = {
  11155111: "https://eth-sepolia.public.blastapi.io",
  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Ethereum Mainnet
  137: 'https://polygon-rpc.com', // Polygon
  56: 'https://bsc-dataseed.binance.org', // Binance Smart Chain
  920637907288165: "https://sepolia-rpc.kakarot.org"
  // Add more networks as needed

  // [constants.StarknetChainId.SN_SEPOLIA]:process.env.PROVIDER_URL
};

