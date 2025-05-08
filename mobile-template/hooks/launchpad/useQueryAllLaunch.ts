import {useNetwork} from '@starknet-react/core';
import {useQuery} from '@tanstack/react-query';

import {CHAIN_ID} from '../../constants/env';
import {useDataCoins} from './useDataCoins';

export const useQueryAllLaunch = () => {
  const chain = useNetwork();
  const {getAllLaunch} = useDataCoins();
  const chainId = chain?.chain?.id;
  return useQuery({
    queryKey: ['get_all_launch', CHAIN_ID],
    queryFn: async () => {
      const launches = await getAllLaunch();
      return launches;
    },
    placeholderData: [],
  });
};
