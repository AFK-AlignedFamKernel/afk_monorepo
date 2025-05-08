import { LAUNCHPAD_ADDRESS } from 'common';
import { AccountInterface, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, CallData, constants, uint256 } from 'starknet';

// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import { formatFloatToUint256 } from '../../utils/format';
import { BondingType, MetadataOnchain } from '../../types/keys';
import { byteArray } from 'starknet';

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
};

export const useCreateToken = () => {
  const deployToken = async (account: AccountInterface, data: DeployTokenFormValues) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';

      console.log('deployCall');

      let initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);
      console.log('initial supply', initial_supply);
    ;
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
          owner: data?.recipient ?? account?.address,
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
    }
  };

  const deployTokenAndLaunch = async (account: AccountInterface, data: DeployTokenFormValues, metadata?: MetadataOnchain) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';

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

      let creator_fee_destination = cairo.felt(data?.creator_fee_destination ?? account?.address)

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
        token_address: metadata?.token_address ?? account?.address,
        url: urlMetadata,
        nostr_event_id: nostrEventIdUint,
        twitter: twitterByteArray,
        github: githubByteArray,
        telegram: telegramByteArray,
        website: websiteByteArray,
      };
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_and_launch_token',
        calldata: CallData.compile({
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
          creator_fee_destination: creator_fee_destination,
          metadata: metadata ? new CairoOption(CairoOptionVariant.Some, metadataLaunch) : new CairoOption(CairoOptionVariant.None)
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
    }
  };

  const launchToken = async (account: AccountInterface, coin_address: string) => {
    try {
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'launch_token',
        calldata: CallData.compile({
          coin_address,
        }),
      };

      const tx = await account.execute(deployCall);
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error launch token', error);
      console.log('Error deploy token', error);
      return Promise.reject(error);
    }
  };


  const deployTokenAndLaunchWithMetadata = async (account: AccountInterface, data: DeployTokenFormValues, metadata?: MetadataOnchain) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';

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

      let creator_fee_destination = cairo.felt(data?.creator_fee_destination ?? account?.address)

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
      const nostrEventIdUint = uint256.bnToUint256(`0x${metadata?.nostr_event_id}`); // Recipient nostr pubkey
      const metadataLaunch = {
        token_address: metadata?.token_address ?? account?.address,
        url: urlMetadata,
        nostr_event_id: nostrEventIdUint,
        twitter: twitterByteArray,
        github: githubByteArray,
        telegram: telegramByteArray,
        website: websiteByteArray,
      };
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_and_launch_token_with_metadata',
        calldata: CallData.compile({
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
          creator_fee_destination: creator_fee_destination,
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
    }
  };

  return {
    deployToken,
    deployTokenAndLaunch,
    launchToken,
    deployTokenAndLaunchWithMetadata,
  };
};
