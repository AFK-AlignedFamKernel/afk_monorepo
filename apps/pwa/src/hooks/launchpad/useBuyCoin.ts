import { useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { formatFloatToUint256 } from '@/utils/format';
import { CallData, constants, uint256 } from 'starknet';
import { LAUNCHPAD_ADDRESS, TOKENS_ADDRESS } from 'common';
export const useBuyCoin = () => {
  const { account } = useAccount();

  const handleBuyCoins = useCallback(
    async (
      accountAddress: string | undefined,
      memecoinAddress: string | undefined,
      amount: number,
      quoteToken: string | undefined,
    ) => {
      if (!account) {
        throw new Error('No account connected');
      }
      const addressContract = LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
      const quoteTokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;

      if(!memecoinAddress) {
        throw new Error('Missing required parameters');
      }

      if(!account?.address) {
        throw new Error('No account connected');
      }
      // if (!accountAddress || !memecoinAddress || !quoteToken) {
      //   throw new Error('Missing required parameters');
      // }

      try {
        // TODO: Implement actual buying logic
        console.log('Buying coins:', {
          accountAddress,
          memecoinAddress,
          amount,
          quoteToken,
        });
        let amountUint256 = formatFloatToUint256(amount);
        // amountUint256 = uint256.bnToUint256(BigInt('0x' + amount));
        console.log('amountuint256', amountUint256);
        const buyKeysParams = {
          accountAddress, // token address
          amount: amountUint256,
          // amount: cairo.uint256(amount), // amount int. Float need to be convert with bnToUint
          // amount: uint256.bnToUint256(amount*10**18), // amount int. Float need to be convert with bnToUint
          // amount: uint256.bnToUint256(BigInt(amount*10**18)), // amount int. Float need to be convert with bnToUint
        };
        // const approveCall = {
        //   contractAddress: asset?.address,
        //   entrypoint: 'approve',
        //   calldata: CallData.compile({
        //     address: addressContract,
        //     amount: amountToPaid ? cairo.uint256(amountToPaid) : cairo.uint256(1),
        //   }),
        //   // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
        // };
        const approveCall = {
          contractAddress: TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountUint256,
          }),
          // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
        };

        console.log('memecoinAddress', memecoinAddress);
    
        const buyCoinCall = {
          contractAddress: addressContract,
          entrypoint: 'buy_coin_by_quote_amount',
          calldata: CallData.compile({
            memecoin_address: memecoinAddress,
            amount: amountUint256,
          }),
          // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
        };
        console.log('CabuyKeysCallll', buyCoinCall);

        const tx = await account?.execute([approveCall,
           buyCoinCall
          ], undefined, {});
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);

        return {
          tx:wait_tx,
        }

      } catch (error) {
        console.error('Error buying coins:', error);
        throw error;
      }
    },
    [account],
  );

  return { handleBuyCoins };
}; 