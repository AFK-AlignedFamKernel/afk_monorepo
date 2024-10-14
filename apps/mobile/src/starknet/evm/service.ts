import {} from '@avnu/avnu-sdk';
import axios from 'axios';

import {
  IAvnuExecuteSwap,
  IAvnuQueryType,
  IAvnuSwapBuildDataTypeReturnTypeObj,
  IAvnuSwapBuildTypedata,
  IAvnuSwapCalldata,
  IAvnuSwapCalldataReturnTypeObj,
  IGetAvnuQuoteReturnTypeObj,
  IGetPoolReturnTypeObj,
  IGetQuoteReturnTypeObj,
  IGetTokenReturnTypeObj,
  IPriceReturnType,
  IQuotePrice,
  IQuoteSwapQuery,
} from './types';

const ekuboBaseUrl = process.env.EXPO_PUBLIC_EKUBO_API || 'https://mainnet-api.ekubo.org';
const ekuboQuoteBaseUrl = process.env.EXPO_PUBLIC_EKUBO_ROUTE_API;
const avnuApi = process.env.EXPO_PUBLIC_AVNU_API || 'https://starknet.api.avnu.fi';

export const ApiEvmInstance = axios.create({
  baseURL: ekuboBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ApiEvmInstance2 = axios.create({
  baseURL: avnuApi,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    'ask-signature': 'true',
  },
});

/**
 * AVNU APIS
 * @param query
 * @returns
 */
export const fetchGetAvnuSwapQuoteFn = async (
  query: IAvnuQueryType,
): Promise<IGetAvnuQuoteReturnTypeObj[]> => {
  try {
    const response = await ApiEvmInstance2.get(
      `/swap/v2/quotes?sellTokenAddress=${query.sellTokenAddress}&buyTokenAddress=${query.buyTokenAddress}&sellAmount=${query.sellAmount}&integratorName=AVNU%20Portal`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Use this for gas transaction which is default for now
 * OnSuccess we execute tx with calldata
 * @param payload
 * @returns
 */
export const buildAvnuSwapCallDataFn = async (
  payload: IAvnuSwapCalldata,
): Promise<IAvnuSwapCalldataReturnTypeObj> => {
  try {
    const response = await ApiEvmInstance2.post(avnuApi + `/swap/v2/build`, payload);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * We can use this for gasless transaction -->
 * @param payload
 * @returns
 */
export const buildAvnuSwapBuildTypeFn = async (
  payload: IAvnuSwapBuildTypedata,
): Promise<{data: IAvnuSwapBuildDataTypeReturnTypeObj; signature: any}> => {
  try {
    const response = await ApiEvmInstance2.post(avnuApi + `/swap/v2/build-typed-data`, payload);
    // Extract the signature from the response headers
    const signature = response.headers['signature'] || null;
    return {
      data: response.data,
      signature,
    };
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * We can use this when dealing with gasless transaction -->
 * @param payload
 * @returns
 */
export const executeAvnuSwapFn = async (
  payload: IAvnuExecuteSwap,
): Promise<IGetAvnuQuoteReturnTypeObj[]> => {
  try {
    const response = await ApiEvmInstance2.post(avnuApi + `/swap/v2/execute`, payload);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Ekubo APIS
 * @returns
 */

export const fetchEvmTokenFn = async (): Promise<IGetTokenReturnTypeObj[]> => {
  try {
    const response = await ApiEvmInstance.get('/tokens');
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Returns a quote for a swap or series of swaps to/from one token amount from/to another token
 * Meaning /token/otherToken 1From token is === 0.00xx toToken
 * @returns
 */

export const fetchGetSwapQuoteFn2 = async (
  query: IQuoteSwapQuery,
): Promise<IGetQuoteReturnTypeObj> => {
  try {
    const response = await ApiEvmInstance.get(
      `/quote/${query.amount}/${query.token}/${query.otherToken}`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Returns a quote for a swap or series of swaps to/from one token amount from/to another token
 * Meaning /token/otherToken 1From token is === 0.00xx toToken
 * @returns
 */
export const fetchGetSwapQuoteFn = async (
  query: IQuoteSwapQuery,
): Promise<IGetPoolReturnTypeObj> => {
  try {
    const response = await axios.get(
      ekuboQuoteBaseUrl + `/${query.amount}/${query.token}/${query.otherToken}`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const fetchGetQuotePriceFn = async (query: IQuotePrice): Promise<IPriceReturnType> => {
  try {
    const response = await ApiEvmInstance.get(
      `/price/${query.baseToken}/${query.quoteToken}?${query.atTime}&period=${query.period}`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
