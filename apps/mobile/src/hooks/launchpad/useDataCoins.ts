import {useAccount, useNetwork, useProvider} from '@starknet-react/core';
import {useQuery} from '@tanstack/react-query';
import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, constants, Contract, ProviderInterface, RpcProvider} from 'starknet';

import {CHAIN_ID} from '../../constants/env';
/** @TODO determine paymaster master specs to send the TX */
export const prepareAndConnectContract = async (
  provider: ProviderInterface,
  contractAddress: string,
  account?: AccountInterface,
) => {
  // read abi of Test contract
  console.log('contractAddress', contractAddress);
  // console.log("provider",await provider.getChainId())

  const {abi: testAbi} = await provider.getClassAt(contractAddress);
  if (testAbi === undefined) {
    throw new Error('no abi.');
  }
  const contract = new Contract(testAbi, contractAddress, provider);
  console.log('contract', contract);

  // Connect account with the contract
  if (account) {
    contract.connect(account);
  }
  return contract;
};

export const useDataCoins = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;

  // const provider = rpcProvider?.provider ?? new RpcProvider({ nodeUrl:  'http://127.0.0.1:5050'  });
  // const provider = rpcProvider?.provider ?? new RpcProvider();
  const provider = new RpcProvider();

  const useQueryDataCoins = () => {
    return useQuery({
      queryKey: ['get_all_coins', CHAIN_ID],
      queryFn: async () => {
        const keys = await getAllCoins();
        return keys;
      },
      placeholderData: [],
    });
  };

  const useQueryDataLaunch = () => {
    return useQuery({
      queryKey: ['get_all_launched_coins', CHAIN_ID],
      queryFn: async () => {
        const keys = await getAllCoins();
        return keys;
      },
      placeholderData: [],
    });
  };

  /** Indexer with Key contract event */
  const getAllCoins = async (account?: AccountInterface, contractAddress?: string) => {
    console.log('getAllCoins');
    const addressContract =
      contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const contract = await prepareAndConnectContract(provider, addressContract, account);
    // if (!account) return;
    // console.log('get key all keys');
    const all_keys = await contract.get_all_launch();
    console.log('allkeys', all_keys);
    return all_keys;
  };

  /** Indexer with Key contract event */
  const getAllLaunch = async (account?: AccountInterface, contractAddress?: string) => {
    console.log('getAllLaunch');
    const addressContract =
      contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const contract = await prepareAndConnectContract(provider, addressContract, account);
    // if (!account) return;
    // console.log('get key all keys');
    const all_launch = await contract.get_all_launch();
    console.log('all_launch', all_launch);
    return all_launch;
  };

  const getMySharesOfUser = async (
    address_user: string,
    account?: AccountInterface,
    contractAddress?: string,
  ) => {
    try {
      if (!account?.address) return;
      const contract = await prepareAndConnectContract(
        provider,
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        account,
      );
      // console.log('contract', contract);
      // console.log('account connected', account?.address);
      // console.log('share of address_user', address_user);
      const share_user: any = await contract.get_share_key_of_user(account?.address, address_user);
      // console.log('share_user', share_user);
      return share_user;
    } catch (e) {
      console.log('Error get my shares of user', e);
    }
  };

  const getCoinLaunchByAddress = async (
    coin_address: string,
    account?: AccountInterface,
    contractAddress?: string,
  ) => {
    try {
      const contract = await prepareAndConnectContract(
        provider,
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        account,
      );
      const share_user: any = await contract.get_coin_launch(coin_address);
      return share_user;
    } catch (e) {
      console.log('Error get coin launch', e);
    }
  };

  const getCoinByAddress = async (
    coin_address: string,
    account?: AccountInterface,
    contractAddress?: string,
  ) => {
    try {
      const contract = await prepareAndConnectContract(
        provider,
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        account,
      );
      const share_user: any = await contract.get_coin_launch(coin_address);
      return share_user;
    } catch (e) {
      console.log('Error get coin launch', e);
    }
  };

  return {
    getAllCoins,
    getMySharesOfUser,
    getCoinByAddress,
    useQueryDataCoins,
    useQueryDataLaunch,
    getAllLaunch,
    getCoinLaunchByAddress,
  };
};
