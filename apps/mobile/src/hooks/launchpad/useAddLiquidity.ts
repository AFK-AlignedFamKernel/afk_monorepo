import {AccountInterface, CallData, constants} from 'starknet';
import {LAUNCHPAD_ADDRESS} from 'common';

export const useAddLiquidity = () => {
  const addLiquidityUnrug = async (
    account: AccountInterface,
    coinAddress: string,
    amount: string,
    startingPrice: string,
    lockTime: string
  ) => {
    try {
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'add_liquidity_unrug',
        calldata: CallData.compile({
          coin_address: coinAddress,
          amount,
          starting_price: startingPrice,
          lock_time: lockTime
        }),
      };

      const tx = await account.execute(deployCall);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  };

  return {
    addLiquidityUnrug
  };
};
