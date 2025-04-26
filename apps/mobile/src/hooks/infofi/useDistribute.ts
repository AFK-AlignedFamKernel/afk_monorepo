import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS } from 'common';
import { AccountInterface, byteArray, cairo, CairoCustomEnum, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';
import { useQuery } from '@tanstack/react-query';
import { ApiIndexerInstance } from '../../services/api';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
export const NAMESERVICE_ENDPOINTS = {
  claimed: '/username-claimed',
  byUsername: (username: string) => `/username-claimed/username/${username}`,
  byUser: (address: string) => `/username-claimed/user/${address}`,
} as const;


// Original useNameservice hook for contract interactions
export const useDistribute = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const handleDistribute = async (
    account: AccountInterface,
    distributeFor: string,
    epochIndex: number,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    const distributeCallData = CallData.compile({
      starknet_user_address: uint256.bnToUint256(`0x${distributeFor}`),
      epoch_index:epochIndex
    });

    const distribute = {
      contractAddress: addressContract,
      entrypoint: 'distribute_rewards_by_user',
      calldata: distributeCallData
    };

    const tx = await account?.execute([distribute], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  const handleClaimMyRewards = async (
    account: AccountInterface,
    epochIndex:number,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    const distributeCallData = CallData.compile({
      epoch_index:epochIndex
    });

    const distribute = {
      contractAddress: addressContract,
      entrypoint: 'claim_and_distribute_my_rewards',
      calldata: distributeCallData
    };

    const tx = await account?.execute([distribute], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  return {
    handleDistribute,
    handleClaimMyRewards
  };
};
