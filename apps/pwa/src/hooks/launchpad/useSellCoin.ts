import { useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { CallData, constants, cairo, uint256 } from 'starknet';
import { LAUNCHPAD_ADDRESS, TOKENS_ADDRESS } from 'common';
import { feltToAddress, formatFloatToUint256 } from 'common';

export const useSellCoin = () => {
  const { account } = useAccount();

  const handleSellCoins = useCallback(
    async (
      accountAddress: string | undefined,
      memecoinAddress: string | undefined,
      amount: number,
      quoteToken: string | undefined,
    ) => {
      if (!account) {
        throw new Error('No account connected');
      }

      if (!memecoinAddress) {
        throw new Error('Missing required parameters');
      }

      const addressContract = LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
      const quoteTokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
      if (!account?.address) {
        throw new Error('No account connected');
      }
      try {
        // TODO: Implement actual buying logic
        console.log('Selling coins:', {
          accountAddress,
          memecoinAddress,
          amount,
          quoteToken,
        });
        let amountUint256 = formatFloatToUint256(amount);
        console.log('amountuint256', amountUint256);
        const approveCall = {
          contractAddress: quoteTokenAddress,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountUint256,
          }),
        };

        console.log('memecoinAddress', memecoinAddress);

        const sellCoinCall = {
          contractAddress: addressContract,
          entrypoint: 'sell_coin',
          calldata: CallData.compile({
            memecoin_address: memecoinAddress,
            amount: amountUint256,
          }),
          // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
        };

        const tx = await account?.execute([approveCall,
          sellCoinCall
        ], undefined, {});
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);

        return {
          tx: wait_tx,
        }
      } catch (error) {
        console.error('Error selling coins:', error);
        throw error;
      }
    },
    [account],
  );

  return { handleSellCoins };
}; 