import {useAccount, useNetwork, useProvider} from '@starknet-react/core';
import {KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS} from 'common';
import {AccountInterface, cairo, CallData, constants, RpcProvider, uint256} from 'starknet';
import {TokenQuoteBuyKeys} from '../../types/keys';
import {feltToAddress, formatFloatToUint256} from '../../utils/format';
import {prepareAndConnectContract} from '../keys/useDataKeys';
import {useQuery} from '@tanstack/react-query';
import {ApiIndexerInstance} from '../../services/api';

export const NAMESERVICE_ENDPOINTS = {
  claimed: '/username-claimed',
  byUsername: (username: string) => `/username-claimed/username/${username}`,
  byUser: (address: string) => `/username-claimed/user/${address}`,
} as const;

export interface NameserviceData {
  owner_address: string;
  username: string;
  time_stamp: string;
  paid: string;
  quote_address: string;
  expiry: string;
}

// Original useNameservice hook for contract interactions
export const useNameservice = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL});

  const handleBuyUsername = async (
    account: AccountInterface,
    username: string,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    const nameservice = await prepareAndConnectContract(provider, addressContract);
    let quote_address: string =
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
      '';
    console.log('read nameservice asset');

    try {
      quote_address = await nameservice.get_token_quote();
    } catch (error) {
      console.log('Error get amount to paid', error);
    }

    const asset = await prepareAndConnectContract(
      provider,
      quote_address ?? TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH,
      account,
    );
    console.log('convert float');
    console.log('read amountToPaid');

    let amountToPaid;
    try {
      /** @TODO fix CORS issue */
      amountToPaid = await nameservice.get_subscription_price(username);
    } catch (error) {
      console.log('Error get amount to paid', error);
    }

    console.log('amount to paid', amountToPaid);

    const approveCall = {
      contractAddress: asset?.address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: amountToPaid ? cairo.uint256(amountToPaid) : cairo.uint256(1),
      }),
    };

    const claimedUsername = {
      contractAddress: addressContract,
      entrypoint: 'claim_username',
      calldata: CallData.compile({
        username: username,
      }),
    };

    console.log('claimedUsername', claimedUsername);

    const tx = await account?.execute([approveCall, claimedUsername], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  return {
    handleBuyUsername,
  };
};

// New indexer hooks
export const useNameserviceData = () => {
  const provider = new RpcProvider({nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL});

  const query = useQuery({
    queryKey: ['nameservice_data'],
    queryFn: async () => {
      const response = await ApiIndexerInstance.get(NAMESERVICE_ENDPOINTS.claimed);

      if (response.status !== 200) {
        throw new Error('Failed to fetch nameservice data');
      }

      return response.data.data as NameserviceData[];
    },
  });

  const prepareBuyUsername = async (account: AccountInterface, username: string) => {
    if (!account) return;

    const addressContract = NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const nameservice = await prepareAndConnectContract(provider, addressContract);
    let quote_address =
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
      '';

    try {
      quote_address = await nameservice.get_token_quote();
    } catch (error) {
      console.log('Error get token quote:', error);
    }

    const asset = await prepareAndConnectContract(
      provider,
      quote_address ?? TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH,
      account,
    );

    let amountToPaid;
    try {
      amountToPaid = await nameservice.get_subscription_price(username);
    } catch (error) {
      console.log('Error get subscription price:', error);
    }

    const approveCall = {
      contractAddress: asset?.address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: amountToPaid ? cairo.uint256(amountToPaid) : cairo.uint256(1),
      }),
    };

    const claimedUsername = {
      contractAddress: addressContract,
      entrypoint: 'claim_username',
      calldata: CallData.compile({
        username: username,
      }),
    };

    return [approveCall, claimedUsername];
  };

  return {
    ...query,
    prepareBuyUsername,
  };
};

export const useNameserviceByUsername = (username: string) => {
  const query = useQuery({
    queryKey: ['nameservice_data', username],
    queryFn: async () => {
      const response = await ApiIndexerInstance.get(NAMESERVICE_ENDPOINTS.byUsername(username));

      if (response.status !== 200) {
        throw new Error('Failed to fetch nameservice data');
      }

      return response.data.data as NameserviceData[];
    },
    enabled: !!username,
  });

  return query;
};
