import { constants } from 'starknet';

export const ESCROW_ADDRESSES = {
  [constants.StarknetChainId.SN_MAIN]: '', // TODO: Add mainnet escrow address

  // AFK Escrow
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x078a022e6906c83e049a30f7464b939b831ecbe47029480d7e89684f20c8d263',

  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee',

  // [constants.StarknetChainId.SN_SEPOLIA]: "0x854a13df46ddc497f610a5bf65097650b0883ce99b6bae614294ecbaf1000d"
};

export const KEYS_ADDRESS = {
  // Old one
  // [constants.StarknetChainId.SN_SEPOLIA]:
  //   '0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1',

  /** NEW KEY MARKETPLACE */
  [constants.StarknetChainId.SN_SEPOLIA]: "0x70a168bae281a7eb0cdcb8c2c8c5708e180ae4c62ff46a4f7cb005fa634cb61",

  [constants.StarknetChainId.SN_MAIN]: '',
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const UNRUGGABLE_FACTORY_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x4dc8fec43040951a22702ef5ad94e76b6fb6692558fc59cd80790c7b21865a1',
  [constants.StarknetChainId.SN_MAIN]:
    '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',

  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5e89dc74f1a40d7814966b028a9b1853d39006a954b27828a9de7e333ec8119",
};

export const NAMESPACE_ADDRESS = {
  [constants.StarknetChainId.SN_SEPOLIA]: "0x6e8ecfa6872bd27a7517077069b401a494687e66e2a98d37311eee1d96f1b57",
  [constants.StarknetChainId.SN_MAIN]: ""
}

export const LAUNCHPAD_ADDRESS = {
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x517110eac4a6e8a50a0966b386a3b19f1facf96a8adb393594a52edf6e9fcc7",
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x74acb6752abb734a7b3388567429217988e02409d9bf43c5586dc2c4f8baf40",
  // [constants.StarknetChainId.SN_SEPOLIA]: "0x5f3ec77fe976b1279ba50d2881f45b9d46e5cee598a2fd41b4d5bd48698baa",
  [constants.StarknetChainId.SN_MAIN]: "",
  [constants.StarknetChainId.SN_SEPOLIA]:"0x5cf19613d54ae5e7c229c87cc26322f2ff6c473d2183723010676b8337c0af3"
}