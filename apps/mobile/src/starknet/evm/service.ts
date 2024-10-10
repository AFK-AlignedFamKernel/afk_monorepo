import {} from '@avnu/avnu-sdk';
import axios from 'axios';

import {
  IAvnuExecuteSwap,
  IAvnuQueryType,
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

const ekuboBaseUrl = process.env.EXPO_PUBLIC_EKUBO_API;
const ekuboQuoteBaseUrl = process.env.EXPO_PUBLIC_EKUBO_ROUTE_API;
const avnuApi = 'https://starknet.api.avnu.fi';

export const ApiEvmInstance = axios.create({
  baseURL: ekuboBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
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
    const response = await axios.get(
      avnuApi +
        `/swap/v2/quotes?sellTokenAddress=${query.sellTokenAddress}&buyTokenAddress=${query.buyTokenAddress}&sellAmount=${query.sellAmount}&integratorName=AVNU%20Portal`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const buildAvnuSwapCallDataFn = async (
  payload: IAvnuSwapCalldata,
): Promise<IAvnuSwapCalldataReturnTypeObj> => {
  try {
    const response = await axios.post(avnuApi + `/swap/v2/build`, payload);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const executeAvnuSwapFn = async (
  payload: IAvnuExecuteSwap,
): Promise<IGetAvnuQuoteReturnTypeObj[]> => {
  try {
    const response = await axios.post(avnuApi + `/swap/v2/execute`, payload);
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
      `/price/${query.baseToken}/${query.quoteToken}?${query.atTime}&peroid=${query.period}`,
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
