import { LAUNCHPAD_ADDRESS } from 'common';
import { AccountInterface, cairo, CairoCustomEnum, CallData, constants } from 'starknet';

// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import { formatFloatToUint256 } from '../../utils/format';
import { BondingType } from '../../types/keys';

export type DeployTokenFormValues = {
  recipient?: string;
  name: string | undefined;
  symbol: string | undefined;
  initialSupply: number | undefined;
  contract_address_salt: string | undefined;
  is_unruggable?: boolean;
  bonding_type?: BondingType
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
      let bondingEnum = new CairoCustomEnum({ Linear: {} });
      console.log('bondingEnum', bondingEnum);
      let bonding = data?.bonding_type

      console.log('bonding', bonding);


      if (data.bonding_type) {
        console.log('bondingEnum', bondingEnum);
        bondingEnum = new CairoCustomEnum({ bonding });

        /** TODO finish corret formatin like above depends on the selected value */
        // if (data?.bonding_type == BondingType.Linear) {
        //   bondingEnum = new CairoCustomEnum({ Linear: {} });
        // }
        // else {
        //   bondingEnum = new CairoCustomEnum({ Exponential: {} });
        // }

      }

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
          bonding_type: bondingEnum
        }),
      };

      const tx = await account.execute(deployCall);
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error deploy token and launch', error);
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
    }
  };

  return {
    deployToken,
    deployTokenAndLaunch,
    launchToken,
  };
};
