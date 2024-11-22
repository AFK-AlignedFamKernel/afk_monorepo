import {useNetwork} from '@starknet-react/core';
// import { LAUNCHPAD_ADDRESS} from '../../constants/contracts';
import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, CallData, constants, RpcProvider} from 'starknet';
// import { CairoOption, CairoOptionVariant } from 'starknet';
import {STRK} from '../../constants/tokens';
import {formatFloatToUint256} from '../../utils/format';

export const useLaunchToken = () => {
  const chain = useNetwork();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL});
  const handleLaunchCoin = async (
    account?: AccountInterface,
    coin_address?: string,
    contractAddress?: string,
  ) => {
    try {


      if(!account) return;

      if(!coin_address) {
        return;
      }
      const addressContract =
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

      console.log('addressContract', addressContract);
      console.log('read asset');
      if (!account) return;

      const launchDeployCall = {
        contractAddress: addressContract,
        entrypoint: 'launch_token',
        calldata: CallData.compile({
          coin_address: coin_address
          // ekubo_pool:CairoOptionVariant.None
        }),
      };

      const tx = await account?.execute([launchDeployCall], undefined, {});
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (e) {
      console.log('Error handleBuyCoins', e);
      return undefined;
    }
  };

  return {handleLaunchCoin};
};
