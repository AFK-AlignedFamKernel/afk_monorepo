import {useQuery} from '@tanstack/react-query';
import {useAuth} from 'afk_nostr_sdk';
import {getChecksumAddress} from 'starknet';

import {CHAIN_ID} from '../../../constants/env';
import {Token, TOKEN_ADDRESSES} from '../../../constants/tokens';
import {ApiIndexerInstance} from '../../../services/api';

export type Tip = {
  transactionHash: string;
  depositId: number;
  sender: string;
  nostrRecipient: string;
  starknetRecipient?: string;
  tokenAddress: string;
  token: Token;
  amount: number;
  gasAmount?: number;
  gasTokenAddress?: string;
  isCancelled: boolean;
  isClaimed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const convertToCamelCase = (tip: any): Tip => {
  return {
    transactionHash: tip.transaction_hash,
    depositId: tip.deposit_id,
    sender: tip.sender,
    nostrRecipient: tip.nostr_recipient,
    starknetRecipient: tip.starknet_recipient,
    tokenAddress: tip.token_address,
    token: TOKEN_ADDRESSES[CHAIN_ID][getChecksumAddress(tip.token_address)],
    amount: tip.amount,
    gasAmount: tip.gas_amount,
    gasTokenAddress: tip.gas_token_address,
    isCancelled: tip.is_cancelled,
    isClaimed: tip.is_claimed,
    createdAt: tip.created_at,
    updatedAt: tip.updated_at,
  };
};

export const useTips = () => {
  const {publicKey} = useAuth();
  return useQuery<Tip[]>({
    queryKey: ['recipient', publicKey],
    queryFn: async () => {
      if (!publicKey) return [];
      const endpoint = `/tips/recipient/${publicKey}`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch recipient tips');
      }

      return res.data.map(convertToCamelCase);
    },
  });
};
