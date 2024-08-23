import {constants, getChecksumAddress} from 'starknet';

export type Token = {
  name: string;
  symbol: TokenSymbol;
  decimals: number;
  address: string;
};

export type TokenMint = {
  name: string;
  symbol: TokenSymbolMint;
  decimals: number;
  address: string;
};

export type MultiChainToken = Record<constants.StarknetChainId, Token>;
export type MultiChainTokens = Record<TokenSymbol, MultiChainToken>;

export type MultiChainTokenMint = Record<constants.StarknetChainId, TokenMint>;
export type MultiChainTokensMint = Record<TokenSymbolMint, MultiChainTokenMint>;

export enum TokenSymbol {
  ETH = 'ETH',
  STRK = 'STRK',
}

export enum TokenSymbolMint {
  WBTC = 'WBTC',
}

export const ETH: MultiChainToken = {
  [constants.StarknetChainId.SN_MAIN]: {
    name: 'Ether',
    symbol: TokenSymbol.ETH,
    decimals: 18,
    address: getChecksumAddress(
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    ),
  },
  [constants.StarknetChainId.SN_SEPOLIA]: {
    name: 'Ether',
    symbol: TokenSymbol.ETH,
    decimals: 18,
    address: getChecksumAddress(
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    ),
  },
};

export const STRK: MultiChainToken = {
  [constants.StarknetChainId.SN_MAIN]: {
    name: 'Stark',
    symbol: TokenSymbol.STRK,
    decimals: 18,
    address: getChecksumAddress(
      '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    ),
  },
  [constants.StarknetChainId.SN_SEPOLIA]: {
    name: 'Stark',
    symbol: TokenSymbol.STRK,
    decimals: 18,
    address: getChecksumAddress(
      '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    ),
  },
};

export const WBTC: MultiChainTokenMint = {
  [constants.StarknetChainId.SN_MAIN]: {
    name: 'Wrapped BTC',
    symbol: TokenSymbolMint.WBTC,
    decimals: 8,
    address: getChecksumAddress(
      '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
    ),
  },
  [constants.StarknetChainId.SN_SEPOLIA]: {
    name: 'Wrapped BTC',
    symbol: TokenSymbolMint.WBTC,
    decimals: 8,
    address: getChecksumAddress(
      '0x00452bd5c0512a61df7c7be8cfea5e4f893cb40e126bdc40aee6054db955129e',
    ),
  },
};

export const TOKENS: MultiChainTokens = {
  [TokenSymbol.ETH]: ETH,
  [TokenSymbol.STRK]: STRK,
};

export const TOKENSMINT: MultiChainTokensMint = {
  [TokenSymbolMint.WBTC]: WBTC,
};

export const TOKEN_ADDRESSES: Record<
  constants.StarknetChainId,
  Record<string, Token>
> = Object.fromEntries(
  Object.values(constants.StarknetChainId).map((chainId) => [
    chainId,
    Object.fromEntries(
      Object.values(TOKENS).map((tokenWithChain) => [
        tokenWithChain[chainId].address,
        tokenWithChain[chainId],
      ]),
    ),
  ]),
) as Record<constants.StarknetChainId, Record<string, Token>>;
