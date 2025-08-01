import { useState } from 'react';
import { LAUNCHPAD_ADDRESS } from 'common';
import { AccountInterface, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, CallData, constants, uint256, shortString } from 'starknet';
// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import { formatFloatToUint256 } from '../utils/format';
import { BondingType, MetadataOnchain } from '../types/token';
import { byteArray } from 'starknet';
import { useStarknet } from './useStarknet';
import { useAccount } from '@starknet-react/core';

export type DeployTokenFormValues = {
  recipient?: string;
  name: string | undefined;
  symbol: string | undefined;
  initialSupply: number | undefined;
  contract_address_salt: string | undefined;
  is_unruggable?: boolean;
  bonding_type?: BondingType;
  creator_fee_percent?: number;
  creator_fee_destination?: string;
  metadata?: MetadataOnchain;
};

export const useCreateToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // const { address } = useStarknet();
  const { account, address: address } = useAccount();
  const deployToken = async (data: DeployTokenFormValues) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';


      if (!data?.recipient || !account?.address) {
        throw new Error('Wallet not connected');
      }
      console.log('deployCall');

      let initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);
      console.log('initial supply', initial_supply);
      // if(Number.isNaN(initial_supply) && Number.isInteger(data?.initialSupply)){
      //   initial_supply = cairo.uint256(data?.initialSupply)
      // }
      console.log('initial supply', initial_supply);

      const nameByteArray = byteArray.byteArrayFromString(data.name ?? 'LFG')
      const symbolByteArray = byteArray.byteArrayFromString(data.symbol ?? 'LFG')
      console.log("byteArray.byteArrayFromString(data.name ?? 'LFG'),", nameByteArray)
      console.log("byteArray.byteArrayFromString(data.symbol ?? 'LFG'),", symbolByteArray)
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_token',
        calldata: CallData.compile({
          owner: data?.recipient || account?.address,
          name: nameByteArray,
          symbol: symbolByteArray,
          // symbol: data.symbol ?? 'LFG',
          // name: data.name ?? 'LFG',
          initialSupply: initial_supply,
          // initialSupply: cairo.uint256(data?.initialSupply ?? 100_000_000),
          // contract_address_salt: cairo.felt(new Date().getTime()?.toString()),
          // contract_address_salt: new Date().getTime()?.toString(),
          contract_address_salt: cairo.felt(String(new Date().getTime() / 1000)),
          // contract_address_salt: new Date().getTime(),
          // is_unruggable: false,
          // is_unruggable: cairo.felt(String(data?.is_unruggable ?? false)),

          // bonding_type:bondingEnum
          // contract_address_salt:CONTRACT_ADDRESS_SALT_DEFAULT + Math.random() + Math.random() / 1000
          // contract_address_salt:cairo.felt(Math.random())
        }),
      };
      console.log('deployCall', deployCall);

      const tx = await account.execute(deployCall);
      console.log('tx', tx);

      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error deploy token', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deployTokenAndLaunch = async (data: DeployTokenFormValues, metadata?: MetadataOnchain) => {
    console.log('deployTokenAndLaunch', data, metadata);
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!account) {
      throw new Error('Wallet not connected');
      // return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const initial_supply = formatFloatToUint256(data.initialSupply ?? 100_000_000);
      let bondingEnum = new CairoCustomEnum({ Linear: {} });

      if (data.bonding_type === BondingType.Linear) {
        bondingEnum = new CairoCustomEnum({ Linear: {} });
      } else if (data.bonding_type === BondingType.Exponential) {
        bondingEnum = new CairoCustomEnum({ Exponential: {} });
      }

      const creator_fee_percent = formatFloatToUint256(data.creator_fee_percent ?? 0, 2);
      const nameByteArray = byteArray.byteArrayFromString(data.name ?? 'LFG');
      console.log('creator_fee_percent', data.creator_fee_percent);
      console.log('creator_fee_percent uint256', creator_fee_percent);
      const symbolByteArray = byteArray.byteArrayFromString(data.symbol ?? 'LFG');

      // const nameByteArray = byteArray.byteArrayFromString('');
      // const symbolByteArray = byteArray.byteArrayFromString('');
      const urlMetadata = byteArray.byteArrayFromString(metadata?.url ?? "");
      const twitterByteArray = metadata?.twitter ? byteArray.byteArrayFromString(metadata?.twitter) : byteArray.byteArrayFromString('');
      const githubByteArray = metadata?.github ? byteArray.byteArrayFromString(metadata?.github) : byteArray.byteArrayFromString('');
      const telegramByteArray = metadata?.telegram ? byteArray.byteArrayFromString(metadata?.telegram) : byteArray.byteArrayFromString('');
      const websiteByteArray = metadata?.website ? byteArray.byteArrayFromString(metadata?.website) : byteArray.byteArrayFromString('');
      const descriptionByteArray = metadata?.description ? byteArray.byteArrayFromString(metadata?.description) : byteArray.byteArrayFromString('');

      const ipfsHash = metadata?.ipfs_hash ? byteArray.byteArrayFromString(metadata?.ipfs_hash) : byteArray.byteArrayFromString("")
      const nostrEventIdUint = metadata?.nostr_event_id ? uint256.bnToUint256(`0x${metadata?.nostr_event_id}`) : cairo.uint256(0); // Recipient nostr pubkey
      const metadataLaunch = {
        token_address: address,
        nostr_event_id: nostrEventIdUint,
        url: urlMetadata,
        ipfs_hash: ipfsHash,
        twitter: twitterByteArray,
        github: githubByteArray,
        telegram: telegramByteArray,
        website: websiteByteArray,
        description: descriptionByteArray,
      };



      if (!data?.recipient && !account?.address) {
        return;
      }
      // console.log("metadataLaunch", metadataLaunch);

      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_and_launch_token',
        calldata: CallData.compile({
          owner: data?.recipient ?? account?.address,
          name: nameByteArray,
          symbol: symbolByteArray,
          initialSupply: initial_supply,
          contract_address_salt: cairo.felt(String(new Date().getTime() / 1000)),
          bonding_type: bondingEnum,
          creator_fee_percent: creator_fee_percent,
          creator_fee_destination: address,
          metadata: metadata ? new CairoOption(CairoOptionVariant.Some, metadataLaunch) : new CairoOption(CairoOptionVariant.None)
          // metadata: new CairoOption(CairoOptionVariant.None)
        }),
      };

      const tx = await account?.execute(deployCall);
      console.log('tx', tx);
      // const wait_tx = await account?.waitForTransaction(tx?.transaction_hash ?? '');
      return tx;
      // const response = await fetch('/api/tokens/deploy', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     deployCall,
      //     address,
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to deploy token');
      // }

      // const result = await response.json();
      // return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const launchToken = async (coin_address: string,

    creator_fee_percent?: number,
    bonding_type?: BondingType,
    creator_fee_destination?: string,
  ) => {
    try {

      if (!account) {
        return;
      }


      if (!creator_fee_destination && !account?.address) {
        return;
      }

      // let bondingEnum = new CairoCustomEnum({Exponential: 1});
      let bondingEnum = new CairoCustomEnum({ Linear: {} });
      // let bondingEnum = new CairoCustomEnum({Linear: 0});
      // let bondingEnum = new CairoCustomEnum({Exponential: {}});
      console.log('[DEBUG] bondingEnum', bondingEnum);

      if (bonding_type !== undefined) {
        // Compare against the enum values
        if (bonding_type === BondingType.Linear) {
          // bondingEnum = new CairoCustomEnum({Linear: 0});
          bondingEnum = new CairoCustomEnum({ Linear: {} });
        } else if (bonding_type === BondingType.Exponential) {
          // bondingEnum = new CairoCustomEnum({Exponential: 1});
          // bondingEnum = new CairoCustomEnum({Exponential: 3});
          bondingEnum = new CairoCustomEnum({ Exponential: {} });
        }
      }

      if (!creator_fee_destination) {
        creator_fee_destination = address;
      }

      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'launch_token',
        calldata: CallData.compile({
          owner: account?.address ?? address,
          coin_address,
          bonding_type: bondingEnum,
          creator_fee_percent: formatFloatToUint256(creator_fee_percent ?? 0),
          creator_fee_destination: creator_fee_destination ?? account?.address,
        }),
      };

      const tx = await account?.execute(deployCall);
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error launch token', error);
      console.log('Error deploy token', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };


  const deployTokenAndLaunchWithMetadata = async (data: DeployTokenFormValues, metadata?: MetadataOnchain) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';


      if (!account) {
        return;
      }

      const defaultAddress = data?.creator_fee_destination ?? address;
      if (!defaultAddress) {
        throw new Error('Wallet not connected');
      }
      const initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);

      // let bondingEnum = new CairoCustomEnum({Exponential: 1});
      let bondingEnum = new CairoCustomEnum({ Linear: {} });
      // let bondingEnum = new CairoCustomEnum({Linear: 0});
      // let bondingEnum = new CairoCustomEnum({Exponential: {}});
      console.log('[DEBUG] bondingEnum', bondingEnum);

      if (data?.bonding_type !== undefined) {
        // Compare against the enum values
        if (data.bonding_type === BondingType.Linear) {
          console.log('[DEBUG] bondingEnum linear', data.bonding_type);
          // bondingEnum = new CairoCustomEnum({Linear: 0});
          bondingEnum = new CairoCustomEnum({ Linear: {} });
        } else if (data.bonding_type === BondingType.Exponential) {
          console.log('[DEBUG] bondingEnum exp', data.bonding_type);
          // bondingEnum = new CairoCustomEnum({Exponential: 1});
          // bondingEnum = new CairoCustomEnum({Exponential: 3});
          bondingEnum = new CairoCustomEnum({ Exponential: {} });
        }
      }
      console.log('[DEBUG] bondingEnum updt', bondingEnum);

      let creator_fee_percent = formatFloatToUint256(data?.creator_fee_percent ?? 0);
      console.log('creator fee percent', creator_fee_percent);

      let creator_fee_destination = cairo.felt(defaultAddress);

      const nameByteArray = byteArray.byteArrayFromString(data.name ?? 'LFG')
      const symbolByteArray = byteArray.byteArrayFromString(data.symbol ?? 'LFG')

      console.log("byteArray.byteArrayFromString(data.name ?? 'LFG'),", nameByteArray)
      console.log("byteArray.byteArrayFromString(data.symbol ?? 'LFG'),", symbolByteArray)
      console.log('initial supply', initial_supply);
      const urlMetadata = byteArray.byteArrayFromString(metadata?.url ? metadata.url : 'LFG');
      const twitterByteArray = byteArray.byteArrayFromString(metadata?.twitter ? metadata.twitter : 'LFG');
      const githubByteArray = byteArray.byteArrayFromString(metadata?.github ? metadata.github : 'LFG');
      const telegramByteArray = byteArray.byteArrayFromString(metadata?.telegram ? metadata.telegram : 'LFG');
      const websiteByteArray = byteArray.byteArrayFromString(metadata?.website ? metadata.website : 'LFG');
      const nostrEventIdUint = metadata?.nostr_event_id ? uint256.bnToUint256(`0x${metadata?.nostr_event_id}`) : cairo.uint256(0); // Recipient nostr pubkey
      const metadataLaunch = {
        token_address: metadata?.token_address ?? address,
        url: urlMetadata,
        nostr_event_id: nostrEventIdUint,
        twitter: twitterByteArray,
        github: githubByteArray,
        telegram: telegramByteArray,
        website: websiteByteArray,
      };

      if (!data?.recipient && !account?.address) {
        return;
      }

      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_and_launch_token_with_metadata',
        calldata: CallData.compile({
          owner: data?.recipient ?? account?.address ?? address,
          name: nameByteArray,
          symbol: symbolByteArray,
          // name: data.name ?? 'LFG',
          // symbol: data.symbol ?? 'LFG',
          initialSupply: initial_supply,
          // contract_address_salt: new Date().getTime() / 1000,
          // contract_address_salt: new Date().getTime(),
          // contract_address_salt: new Date().getTime().toString(),
          contract_address_salt: cairo.felt(String(new Date().getTime() / 1000)),
          // is_unruggable: data?.is_unruggable
          // is_unruggable: cairo.felt(String(data?.is_unruggable ?? false)),
          bonding_type: bondingEnum,
          creator_fee_percent: creator_fee_percent,
          // creator_fee_destination: creator_fee_destination,
          creator_fee_destination: defaultAddress,
          metadata: metadataLaunch
        }),
      };

      const tx = await account.execute(deployCall);
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error deploy token and launch', error);
      console.log('Error deploy token', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deployToken,
    deployTokenAndLaunch,
    launchToken,
    deployTokenAndLaunchWithMetadata,
    isLoading,
    error,
  };
};
