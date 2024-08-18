import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import { AccountInterface, constants, Contract, ProviderInterface, RpcProvider } from 'starknet';

// import { KEYS_ADDRESS } from '../../constants/contracts';

import { useQuery } from '@tanstack/react-query';
import { CHAIN_ID } from '../../constants/env';
import { prepareAndConnectContract, useDataKeys } from './useDataKeys';

export const useQueryAllKeys = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const {getAllKeys} = useDataKeys()
  const chainId = chain?.chain?.id;
  return useQuery({
    queryKey: ['get_all_keys', CHAIN_ID],
    queryFn:async () => {

      const keys= await getAllKeys()
      return keys
    },
    placeholderData:[]
  })
};
