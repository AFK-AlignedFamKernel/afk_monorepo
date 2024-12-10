import {AccountInterface, CallData, constants} from 'starknet';
import {LAUNCHPAD_ADDRESS, EKUBO_DEX_ADDRESS} from 'common';

export const useAddLiquidity = () => {
  const addLiquidityUnrug = async (
    account: AccountInterface,
    coinAddress: string,
    amount: string,
    startingPrice: string,
    lockTime: string,
  ) => {
    try {
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'add_liquidity_unrug',
        calldata: CallData.compile({
          coin_address: coinAddress,
          amount,
          starting_price: startingPrice,
          lock_time: lockTime,
        }),
      };

      const tx = await account.execute(deployCall);
      return await account?.waitForTransaction(tx?.transaction_hash);
    } catch (error) {
      console.error('Error adding unrug liquidity:', error);
      throw error;
    }
  };

  const addLiquidityEkubo = async (
    account: AccountInterface,
    coinAddress: string,
    amount: string,
    price: string,
  ) => {
    try {
      const deployCall = {
        contractAddress: EKUBO_DEX_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'add_liquidity',
        calldata: CallData.compile({
          token_address: coinAddress,
          amount,
          price,
        }),
      };

      const tx = await account.execute(deployCall);
      return await account?.waitForTransaction(tx?.transaction_hash);
    } catch (error) {
      console.error('Error adding Ekubo liquidity:', error);
      throw error;
    }
  };

  const addLiquidityJediswap = async (
    account: AccountInterface,
    coinAddress: string,
    amount: string,
    minLiquidity: string,
  ) => {
    try {
      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'add_liquidity',
        calldata: CallData.compile({
          token: coinAddress,
          amount,
          min_liquidity: minLiquidity,
        }),
      };

      const tx = await account.execute(deployCall);
      return await account?.waitForTransaction(tx?.transaction_hash);
    } catch (error) {
      console.error('Error adding Jediswap liquidity:', error);
      throw error;
    }
  };

  return {
    addLiquidityUnrug,
    addLiquidityEkubo,
    addLiquidityJediswap,
  };
};
