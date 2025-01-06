import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, cairo, CairoCustomEnum, CallData, constants} from 'starknet';

// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import {formatFloatToUint256} from '../../utils/format';
import {BondingType} from '../../types/keys';

export type DeployTokenFormValues = {
  recipient?: string;
  name: string | undefined;
  symbol: string | undefined;
  initialSupply: number | undefined;
  contract_address_salt: string | undefined;
  is_unruggable?: boolean;
  bonding_type?: BondingType;
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

      const initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);

      console.log('initial supply', initial_supply);

      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_token',
        calldata: CallData.compile({
          owner: data?.recipient ?? account?.address,
          symbol: data.symbol ?? 'LFG',
          name: data.name ?? 'LFG',
          initialSupply: initial_supply,
          // initialSupply: cairo.uint256(data?.initialSupply ?? 100_000_000),
          contract_address_salt: new Date().getTime(),
          is_unruggable: cairo.felt(String(data?.is_unruggable)),
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

  const deployTokenAndLaunch = async (account: AccountInterface, data: DeployTokenFormValues) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';

      const initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);

      // let bondingEnum = new CairoCustomEnum({Exponential: 1});
      let bondingEnum = new CairoCustomEnum({Linear: {}});
      // let bondingEnum = new CairoCustomEnum({Exponential: {}});
      console.log('[DEBUG] bondingEnum', bondingEnum);

      if (data?.bonding_type !== undefined) {
        // Compare against the enum values
        if (data.bonding_type === BondingType.Linear) {
          console.log('[DEBUG] bondingEnum linear', data.bonding_type);
          // bondingEnum = new CairoCustomEnum({Linear: 0});
          bondingEnum = new CairoCustomEnum({Linear: {}});
        } else if (data.bonding_type === BondingType.Exponential) {
          console.log('[DEBUG] bondingEnum exp', data.bonding_type);
          // bondingEnum = new CairoCustomEnum({Exponential: 1});
          bondingEnum = new CairoCustomEnum({Exponential: {}});
        }
      }
      console.log('[DEBUG] bondingEnum updt', bondingEnum);

      console.log('initial supply', initial_supply);
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'create_and_launch_token',
        calldata: CallData.compile({
          name: data.name ?? 'LFG',
          symbol: data.symbol ?? 'LFG',
          initialSupply: initial_supply,
          contract_address_salt: new Date().getTime(),
          // is_unruggable: data?.is_unruggable
          is_unruggable: cairo.felt(String(data?.is_unruggable)),
          bonding_type: bondingEnum,
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

  return {
    deployToken,
    deployTokenAndLaunch,
    launchToken,
  };
};
