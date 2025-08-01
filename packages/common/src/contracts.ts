import { constants } from 'starknet';
import { kakarotSepolia, mainnet, sepolia } from 'viem/chains';

export const ESCROW_ADDRESSES = {
  [constants.StarknetChainId.SN_MAIN]: '', // TODO: Add mainnet escrow address

  // AFK Escrow
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x078a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263',

  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x1ed7f4d0afce7bd17acecae039f255724d194373f104ce04b3146d6461e09f',
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x7b1cee9650c127b80067e02b6235a526e3c68ba0401460c3e5dcff58ddcd154',

  // [constants.StarknetChainId.SN_SEPOLIA]: "0x854a13df46ddc497f610a5bf65097650b0883ce99b6bae614294ecbaf1000d"
};

export const KEYS_ADDRESS = {
  // Old one
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1',

  /** NEW KEY MARKETPLACE */
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x70a168bae281a7eb0cdcb8c2c8c5708e180ae4c62ff46a4f7cb005fa634cb61',

  [constants.StarknetChainId.SN_MAIN]: '',
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const UNRUGGABLE_FACTORY_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1',
  [constants.StarknetChainId.SN_MAIN]:
    '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',

  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x3e283a6fc0de84a701ba3cb99832afed83ca37ab9ea835e41a6889bdecd6b7',


  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};



export const LAUNCHPAD_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: '',
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x525d47343caa4c56cd28eeeff7d503f1b80872c5a7f4a9f8ac8130de3513f70",
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x6fbcf2a0df5716d83d9653985f9c9bde6fb73130f0804e18bb18ef6f6ae7ad2"
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //  "0x4cefb7ab4c3fda72df52f288e141ff1dc6956a497949bf7b0031f012f3d3afc",
  //  [constants.StarknetChainId.SN_SEPOLIA]:
  //  "0x4a5d414ec6085ef5d3779b6e72015076b1a1ecdb6065fe1123d794ff41aea4d",

  // old contract
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x7fbf067657772a454c302354a19e07ce0a920736e2e3b7ca605d813723db883"
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x2df96069550099b5e1f94c38848374e1b7ea1832d5ce17ec459bf5bbaef53ad",
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x34e73d4ff75f922484a9208f506e9aa8acfdb333a648ca68cde276d83678aa9",
  // new launchpad
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3",
  [constants.StarknetChainId.SN_SEPOLIA]: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548",

};

export const ESCROW_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee',
};

export const TOKENS_ADDRESS = {
  SEPOLIA: {
    ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    // TEST: "0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4",

    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    USDC: '0x02f37c3e00e75ee4135b32bb60c37e0599af264076376a618f138d2f9929ac74',
    TEST: '0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4',
    BIG_TOKEN: '0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4',
  },
  [constants.StarknetChainId.SN_SEPOLIA]: {
    ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    USDC: '0x02f37c3e00e75ee4135b32bb60c37e0599af264076376a618f138d2f9929ac74',
    BIG_TOKEN: '0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4',
  },
  [sepolia.id]: {
    ETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  [kakarotSepolia.id]: {
    ETH: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
  },
  [mainnet.id]: {
    USDC: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  [constants.StarknetChainId.SN_MAIN]: {
    ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    USDC: '0x02f37c3e00e75ee4135b32bb60c37e0599af264076376a618f138d2f9929ac74',
    BIG_TOKEN: '0x00148a15f9fbf4c015b927bf88608fbafb6d149abdd5ef5b3e3b296e6ac999a4',
  },
  DEVNET: {
    ETH: '0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7',
    TEST: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  },

  KAKAROT: {
    [constants.StarknetChainId.SN_SEPOLIA]: {
      ETH: '0x761612F0C8bdf8cF10e6F10045E2Ca7cbffBa8A3',
      USDc: '0x1B4C0bc8703D3af59322849bE01559fdb920c904',
      USDt: '0x2BF1004D9e80ca087BD1e089d75bc8c471995aC1',
    },
  },
};

export const CLASS_HASH = {
  TOKEN: {
    // [constants.StarknetChainId.SN_SEPOLIA]:
    // "0x142180837a41ad06cc36fbc8c449ba4516397b1a82f260c206afd3411e9fe0d",
    [constants.StarknetChainId.SN_SEPOLIA]:
      '0x43b100e1cd969dc45b1d59afcda47ee52444e5baba9ef511a16858d2067ecb7',

    // "0x58daf8998746438d557781b7a9ec1fbda1252c47196f158dcce2df55682644a",
    // "0x97341df71bdc18c3c1d9496a238f92b895c0c3d61725481641c851d3db0851",
    [constants.StarknetChainId.SN_MAIN]: '',
  },
  MEMECOIN: {
    // [constants.StarknetChainId.SN_SEPOLIA]:
    // "0x142180837a41ad06cc36fbc8c449ba4516397b1a82f260c206afd3411e9fe0d"
    [constants.StarknetChainId.SN_SEPOLIA]:
      '0x43b100e1cd969dc45b1d59afcda47ee52444e5baba9ef511a16858d2067ecb7',
    // "0x58daf8998746438d557781b7a9ec1fbda1252c47196f158dcce2df55682644a",
    // "0x97341df71bdc18c3c1d9496a238f92b895c0c3d61725481641c851d3db0851"
  },
};

export const JEDISWAP_V2_NFT_ROUTER = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x024fd9721eea36cf8cebc226fd9414057bbf895b47739822f849f622029f9399',
  [constants.StarknetChainId.SN_MAIN]: '',
};

export const JEDISWAP_V2_FACTORY = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x050d3df81b920d3e608c4f7aeb67945a830413f618a1cf486bdcce66a395109c',
  [constants.StarknetChainId.SN_MAIN]: '',
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
    '0x1d3c8e4dcc100eb88e418d89a012326bd904fe5de061aee5df505a30d0ff5e9',
};

export const USERNAME_STORE_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x3af00ab1a4d280793d311c610173bdf84b6e2fd2221bacfc52d19531413e00c',
};

export const EKUBO_CORE = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x0444a09d96389aa7148f1aada508e30b71299ffe650d9c97fdaae38cb9a23384',
  [constants.StarknetChainId.SN_MAIN]:
    '0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b',
};

export const EKUBO_POSITION = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x06a2aee84bb0ed5dded4384ddd0e40e9c1372b818668375ab8e3ec08807417e5',
  [constants.StarknetChainId.SN_MAIN]:
    '0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067',
};

export const EKUBO_DEX_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763',
  [constants.StarknetChainId.SN_MAIN]:
    '0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e',
};

export const EKUBO_REGISTRY = {
  // V2
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x0293c0d738eff5aa65619069d437eba2bcb320fb8003f37c9708afcdbe8739c8',
  [constants.StarknetChainId.SN_MAIN]:
    '0x0013e25867b6eef62703735aa4cfa7754e72f4e94a56c9d3d9ad8ebe86cee4aa',

  // V3 support bytearray
  // [constants.StarknetChainId.SN_SEPOLIA]:
  // "0x04484f91f0d2482bad844471ca8dc8e846d3a0211792322e72f21f0f44be63e5",
  // [constants.StarknetChainId.SN_MAIN]: "0x064bdb4094881140bc39340146c5fcc5a187a98aec5a53f448ac702e5de5067e",
};

export const NAMESERVICE_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: '',
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x4fe0ee38c814e0599a5140c5673a233d227ce0be9e22c3acdbee15ac9aefc10",

  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f',
};


export const UNRUGGABLE_LIQUIDITY_ADDRESSES = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0xe39ea1a892ea736b2720cae35186cec2961364e88de4c502d0c076da916305",
  [constants.StarknetChainId.SN_MAIN]:
    '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',

  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x59519f8c82fcb0503fda34b30c1758a40bd7da43b96abaab106f5141fa7f53f',


  // "0x1762c43e814c9e2319e08479df2764fa83436569aefa9a42d4911c43afc5302"
  // "0x3ea02b0aee81e72c4b79cd4205dccc0b0d497ca23162bd0e8f7174d449d7980",
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const DAO_FACTORY_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x67abfcaab98916c954c6a82260f61f566488dd72d94a6b1fb6be0cd2462703e',
  [constants.StarknetChainId.SN_MAIN]: '0x',
} as { [key in string]: `0x${string}` };

export const MULTI_CANVAS_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x5461b6b463357260de27286586f2384f33ba519be0d31460c9bffc795aa168b',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  // '0x3f842da2cb1dbc81cb9ddd88206007494cdc3cac1409d558217794a052e79cf',
  [constants.StarknetChainId.SN_SEPOLIA]:
  '0x1fa80c2a03bb724e7b6cf7836a32ba5e300e10914c48a7109d6ff86045e1e70',
  
  [constants.StarknetChainId.SN_MAIN]: '0x',
} as { [key in string]: `0x${string}` };

export const RPC_URLS_NUMBER: { [key: number]: string } = {
  11155111: 'https://eth-sepolia.public.blastapi.io',
  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Ethereum Mainnet
  137: 'https://polygon-rpc.com', // Polygon
  56: 'https://bsc-dataseed.binance.org', // Binance Smart Chain
  920637907288165: 'https://sepolia-rpc.kakarot.org',
  // Add more networks as needed

  // [constants.StarknetChainId.SN_SEPOLIA]:process.env.PROVIDER_URL
};

export const NOSTR_FI_SCORING_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0xb44d9e32a43d3b25616cc93795d4c53f751ab0e9fe3860d8852e67346477df",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x2e6e0decf99cf883e9c72d22fa439ca0abbf4989c5f472901c4072a78d74c39",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x58c016ef8fe64adb660b4b785fc35a4dd428781d63d8660a02ee2edcf457437",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x22406b77c60ef86217236e56d0ce07bc761cf77f5b411e50dc0bd9fc8108756",

  [constants.StarknetChainId.SN_SEPOLIA]:
  "0x1ac5004a5deb46fb23ca5a8821a9c156cad1b173ffd3c48e7a3151288d7c615",

};

export const CLASS_HASH_NOSTR_FI_SCORING = {
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x78a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x30298dde4ac7e0298afa26af3203c659c9689b5094282d3ed44df4a5fe80462",
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   "0x269464f9d4e946bf5405f4afd1901a27bc243bcea8a316c7c31be7463293590",
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x2915dec2316154ad2c6fe34b0a67a4cdfaad884193cef240ab6de6986f9effc",
    
};

export const NAMESPACE_ADDRESS = {

  [constants.StarknetChainId.SN_MAIN]: '',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  // '0x6e8ecfa6872bd27a7517077069b401a494687e66e2a98d37311eee1d96f1b57',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  // '0x11596a9272e292d5cfd7a5adaa8056a966ee5e918b4415371248d494686105a',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x4b200c273875161f856279d03c6feb2b84e4dc80421532c80e47a78f8ac2a3',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x078a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263',
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x6fc141da9eb868fcbca7602d4adec639cf5437172de880e75e9f1ce14205c64',


  // [constants.StarknetChainId.SN_SEPOLIA]:"0x75a336b94c31f47024d1fae7d50d2178befd332ac50bad6158ace12269de6e6"
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x7607c8a50b83938ea3f9da25dc1b7024814c0e5bf4b40bf6d6ff9bc7387aa7d"

  // MVP
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x07607c8A50b83938ea3f9DA25DC1b7024814C0E5bF4B40bF6D6FF9Bc7387aa7d"
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x11331ec2cefc3804d6ae0fa5f5a077dcb078e59cdaee2f75f1d68f133b363e1",
  [constants.StarknetChainId.SN_SEPOLIA]: "0x6690853be3b6156b181ad02cd6ca665fe9518f3d13d622731593a65bd51104",


  

};


export const FACTORY_SCORE_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x20f02a8bebe4728add0704b8ffd772595b4ebf03103560e4e23b93bdbf75dec',
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x14a4fd9449345aa472b4b4ab69e2547c73bb11b35679f2f3cf38c7a89a6b272',

    
  [constants.StarknetChainId.SN_MAIN]: '',
}



