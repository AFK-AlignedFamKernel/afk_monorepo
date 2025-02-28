import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetCandles = (tokenAddress: string, interval = 5) => {
  return useQuery({
    queryKey: ['candle_graph', tokenAddress, interval],
    queryFn: async ({queryKey}) => {
      const [_, tokenAddress, interval] = queryKey;
      const endpoint = `/get-candles/${tokenAddress}?interval=${interval}`;
      const res = await ApiIndexerInstance.get(endpoint);
      console.log('res', res);

      if (res.status !== 200) {
        throw new Error('Failed to fetch candlestick data');
      }

      return res.data;
    },
  });
};
