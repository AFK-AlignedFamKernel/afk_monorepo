import { constants, hash, shortString } from 'starknet';

// type SupportedChainId = Exclude<
//   constants.StarknetChainId,
//   typeof constants.StarknetChainId.SN_GOERLI
// >;

type SupportedChainId = constants.StarknetChainId;
type AddressesMap = Record<SupportedChainId, string>;

export const BLANK_ACCOUNT_CLASS_HASH =
  '0x1fa186ff7ea06307ded0baa1eb7648afc43618b92084da1110a9c0bd2b6bf56';

export enum Entrypoint {
  DEPLOY_ACCOUNT = 'deploy_account',
  EXECUTE_FROM_OUTSIDE = 'execute_from_outside_v2',
}

export const VAULT_FACTORY_ADDRESSES: AddressesMap = {
  [constants.StarknetChainId.SN_MAIN]:
    '0x410da9af28e654fa93354430841ce7c5f0c2c17cc92971fb23d3d4f826d9834',
  [constants.StarknetChainId.SN_SEPOLIA]:
    '0x33498f0d9e6ebef71b3d8dfa56501388cfe5ce96cba81503cd8572be92bd77c',
};

// eslint-disable-next-line import/no-unused-modules
export const SN_CHAIN_ID = (constants.StarknetChainId[
  (process.env.SN_NETWORK ?? 'SN_SEPOLIA') as constants.NetworkName
] ?? constants.StarknetChainId[constants.NetworkName.SN_SEPOLIA]) as SupportedChainId;

// const NODE_URLS = {
//   [constants.StarknetChainId.SN_MAIN]: (apiKey: string) => `https://rpc.nethermind.io/mainnet-juno/?apikey=${apiKey}`,
//   [constants.StarknetChainId.SN_SEPOLIA]: (apiKey: string) =>
//     `https://rpc.nethermind.io/sepolia-juno/?apikey=${apiKey}`,
// }

const NODE_URLS = {
  [constants.StarknetChainId.SN_MAIN]: (apiKey: string) =>
    `https://starknet-sepolia.g.alchemy.com/v2/${apiKey}`,
  [constants.StarknetChainId.SN_SEPOLIA]: (apiKey: string) =>
    `https://starknet-sepolia.g.alchemy.com/v2/${apiKey}`,
};

export const NODE_URL = NODE_URLS[SN_CHAIN_ID](process.env.RPC_NODE_API_KEY!);

/**
 * Starkent Message Signature Structure
 */
export const typedDataValidate = {
  types: {
    StarkNetDomain: [
      { name: 'name', type: 'felt' },
      { name: 'version', type: 'felt' },
      { name: 'chainId', type: 'felt' },
    ],
    Message: [{ name: 'message', type: 'felt' }],
  },
  primaryType: 'Message',
  domain: {
    name: 'Afk',
    chainId: shortString.encodeShortString(process.env.EXPO_PUBLIC_NETWORK || 'SN_MAIN'),
    version: '1',
  },
  message: {
    message: {
      message: 'Sign Signature',
    },
  },
};
