import {useNetwork} from '@starknet-react/core';
import {useQuery} from '@tanstack/react-query';

import {CHAIN_ID} from '../../constants/env';
import {useDataCoins} from './useDataCoins';

export const useQueryAllCoins = () => {
  const chain = useNetwork();
  const {getAllCoins} = useDataCoins();
  return useQuery({
    queryKey: ['get_all_coins', CHAIN_ID],
    queryFn: async () => {
      const coins = await getAllCoins();
      return coins;
    },
    placeholderData: [],
  });
};
