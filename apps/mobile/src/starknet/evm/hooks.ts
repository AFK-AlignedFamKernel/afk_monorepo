import {useMutation, useQuery} from '@tanstack/react-query';

import {
  buildAvnuSwapCallDataFn,
  executeAvnuSwapFn,
  fetchEvmTokenFn,
  fetchGetAvnuSwapQuoteFn,
  fetchGetQuotePriceFn,
  fetchGetSwapQuoteFn,
} from './service';
import {IAvnuQueryType, IQuotePrice, IQuoteSwapQuery} from './types';

interface UseGetEvmTokensOptions {
  search?: string;
}

export const useGetEvmTokens = (options?: UseGetEvmTokensOptions) => {
  return useQuery({
    queryKey: ['evmTokens', options?.search],
    queryFn: () => fetchEvmTokenFn(),
    select: (data) => {
      if (!options?.search) {
        return data;
      }
      const lowercasedSearch = options.search.toLowerCase();
      return data.filter((token) => token.name.toLowerCase().includes(lowercasedSearch));
    },
  });
};

export const useGetSwapQuoteDetails = ({...options}: IQuoteSwapQuery) => {
  return useQuery({
    queryKey: [
      'swapQuoteDetails',
      options.otherToken,
      options.token,
      options.amount,
      options.direction,
    ],
    queryFn: () => fetchGetSwapQuoteFn(options),
  });
};

export const useGetSwapQuoteDetails2 = ({...options}: IQuoteSwapQuery) => {
  const roundedAmount = Math.ceil(parseFloat(options.amount));
  return useQuery({
    queryKey: ['swapQuoteDetails', options.otherToken, options.token, options.amount],
    queryFn: () => fetchGetSwapQuoteFn({...options, amount: roundedAmount as any}),
    enabled: roundedAmount > 0, // Only execute if rounded amount is greater than 0
  });
};

export const useGetQuotePrice = ({...options}: IQuotePrice) => {
  return useQuery({
    queryKey: ['quotePrice', options.period, options.baseToken, options.quoteToken],
    queryFn: () => fetchGetQuotePriceFn(options),
    enabled: options.baseToken ? true : false,
  });
};

/**
 * Avnu Hooks for fetching quotes swapping and executing swap.
 */

export const useAvnuSwapCalldata = () => {
  return useMutation({
    mutationKey: ['avnuSwapCallData'],
    mutationFn: buildAvnuSwapCallDataFn,
  });
};

export const useAvnuExecuteSwap = () => {
  return useMutation({
    mutationKey: ['avnuExecuteSwap'],
    mutationFn: executeAvnuSwapFn,
  });
};

export const useGetAvnuSwapQuoteDetails = ({...options}: IAvnuQueryType) => {
  return useQuery({
    queryKey: [
      'AvnuQuoteDetails',
      options.buyTokenAddress,
      options.sellTokenAddress,
      options.sellAmount,
    ],
    queryFn: () => fetchGetAvnuSwapQuoteFn(options),
    enabled: options.sellAmount ? true : false,
  });
};
