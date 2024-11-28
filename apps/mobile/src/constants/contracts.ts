import {constants, shortString} from 'starknet';

import {generateNonce} from '../utils/helpers';

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
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x70a168bae281a7eb0cdcb8c2c8c5708e180ae4c62ff46a4f7cb005fa634cb61',

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
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x6e8ecfa6872bd27a7517077069b401a494687e66e2a98d37311eee1d96f1b57',
  [constants.StarknetChainId.SN_MAIN]: '',
};

export const LAUNCHPAD_ADDRESS = {
  [constants.StarknetChainId.SN_MAIN]: '',
  // [constants.StarknetChainId.SN_SEPOLIA]:"0x5cf19613d54ae5e7c229c87cc26322f2ff6c473d2183723010676b8337c0af3",
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x19084523bd7307c2169ee32a336be3f9d9eb6bf24197156cb6fc7a42feb7a5',
};

// export const typedDataValidate = {
//   types: {
//     StarkNetDomain: [
//       {name: 'name', type: 'felt'},
//       {name: 'version', type: 'felt'},
//       {name: 'chainId', type: 'felt'},
//     ],
//     Message: [{name: 'message', type: 'felt'}],
//   },
//   primaryType: 'Message',
//   domain: {
//     name: 'Afk',
//     chainId: shortString.encodeShortString(process.env.EXPO_PUBLIC_NETWORK || 'SN_MAIN'),
//     version: '0.0.1',
//   },
//   message: {
//     message: 'Sign Signature',
//   },
// };

export const typedDataValidate = {
  types: {
    StarkNetDomain: [
      {name: 'name', type: 'felt'},
      {name: 'version', type: 'felt'},
      {name: 'chainId', type: 'felt'},
      {name: 'uri', type: 'felt'},
    ],
    Message: [
      {name: 'address', type: 'felt'},
      {name: 'statement', type: 'felt'},
      {name: 'nonce', type: 'felt'},
      {name: 'issuedAt', type: 'felt'},
    ],
  },
  primaryType: 'Message',
  domain: {
    name: 'AFk',
    version: '0.0.5',
    chainId: shortString.encodeShortString(process.env.EXPO_PUBLIC_NETWORK || 'SN_MAIN'),
    uri: 'https://afk-community.xyz/',
  },
  message: {
    address: '',
    statement: 'I love Afk!',
    nonce: generateNonce.randomString(),
    issuedAt: new Date().toISOString(),
  },
};
