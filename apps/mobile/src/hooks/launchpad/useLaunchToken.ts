import { useNetwork } from '@starknet-react/core';
// import { LAUNCHPAD_ADDRESS} from '../../constants/contracts';
import { LAUNCHPAD_ADDRESS } from 'common';
import { AccountInterface, CallData, constants, RpcProvider, CairoCustomEnum, cairo } from 'starknet';
// import { CairoOption, CairoOptionVariant } from 'starknet';
import { STRK } from '../../constants/tokens';
import { formatFloatToUint256 } from '../../utils/format';
import { BondingType } from '../../types/keys';
import { prepareAndConnectContract } from '../../utils/starknet';

export const useLaunchToken = () => {
  const chain = useNetwork();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const handleLaunchCoin = async (
    account?: AccountInterface,
    coin_address?: string,
    contractAddress?: string,
    bonding_type?: BondingType
  ) => {
    try {
      if (!account) return;

      if (!coin_address) {
        return;
      }
      const addressContract =
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

      console.log('addressContract', addressContract);
      console.log('read asset');
      if (!account) return;

      // const orderToSend: BondingType = { Linear: {} };
      // const myCustomEnum = new CairoCustomEnum({ Linear: {} });

      const erc20 = await prepareAndConnectContract(provider, addressContract, account);
      let totalSupply= cairo.uint256(1);
  
      await erc20.totalSupply()
      console.log("totalSupply", totalSupply)

      const approveCalldata = {
        contractAddress: addressContract,
        entrypoint: 'approve',
        calldata: CallData.compile({
          address: addressContract,
          amount: totalSupply
          // amount: totalSupply
          // ekubo_pool:CairoOptionVariant.None
        }),
      };
      // try {
      // } catch (error) {
      // }

      let bondingEnum = new CairoCustomEnum({ Linear: {} });
      if (bonding_type) {
        bondingEnum = new CairoCustomEnum({ bonding_type });
      }
      // const orderToSend: BondingType = { Linear };
      // const myCustomEnum = new CairoCustomEnum({ Response: orderToSend });
      // const myCustomEnum = new CairoCustomEnum({ Response: orderToSend });
      const launchDeployCall = {
        contractAddress: addressContract,
        entrypoint: 'launch_token',
        calldata: CallData.compile({
          coin_address: coin_address,
          bonding_type: bondingEnum
          // ekubo_pool:CairoOptionVariant.None
        }),
      };

      const tx = await account?.execute([approveCalldata, launchDeployCall], undefined, {});
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (e) {
      console.log('Error handleBuyCoins', e);
      return undefined;
    }
  };

  return { handleLaunchCoin };
};
