import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';
import { DAO_FACTORY_ADDRESS } from 'common';
import { constants } from 'starknet';

import { ABI } from '../abi/daoFactory';

export const useCreateDao = () => {
  const { publicKey } = useAuth();
  const { account } = useAccount();

  const contractAddress = DAO_FACTORY_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

  const { contract } = useContract({ abi: ABI, address: contractAddress });
  const { send, isPending, isSuccess } = useSendTransaction({});

  const createDao = async (tokenAddress: string) => {
    if (!contractAddress || !contract || !account || !publicKey) return;

    send([
      contract.populate('create_dao', [tokenAddress, BigInt('0x' + publicKey), account.address]),
    ]);
  };

  return {
    createDao,
    isPending,
    isSuccess,
  };
};
