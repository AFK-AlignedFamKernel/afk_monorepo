import {useNetwork} from '@starknet-react/core';
// import { LAUNCHPAD_ADDRESS} from '../../constants/contracts';
import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, CallData, constants, RpcProvider} from 'starknet';

import {TokenQuoteBuyKeys} from '../../types/keys';
import {feltToAddress, formatFloatToUint256} from '../../utils/format';
import {STRK, TOKEN_ADDRESSES} from '../../constants/tokens';

export const useBuyCoinByQuoteAmount = () => {
  const chain = useNetwork();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL});
  const handleBuyCoins = async (
    account: AccountInterface,
    coin_address: string,
    amount: number,
    // tokenQuote: TokenQuoteBuyKeys,
    tokenQuote?: string,
    contractAddress?: string,
  ) => {
    try {
      const addressContract =
        contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

      console.log('addressContract', addressContract);
      console.log('read asset');
      if (!account) return;

      // const asset = await prepareAndConnectContract(
      //   provider,
      //   feltToAddress(BigInt(tokenQuote?.token_address)),
      //   // tokenQuote?.token_address?.toString(),
      //   account,
      // );
      // console.log('read launchpad_contract');

      // const quote_address_token = feltToAddress(BigInt(tokenQuote));
      const quote_address_token = tokenQuote ?? STRK[constants.StarknetChainId.SN_SEPOLIA]?.address;
      // const launchpad_contract = await prepareAndConnectContract(provider, addressContract);
      // const launchpad_contract = await prepareAndConnectContract(provider, addressContract, account);

      console.log('amount', amount);
      const amountUint256 = formatFloatToUint256(amount);
      console.log('amountuint256', amountUint256);
      // amountUint256 = uint256.bnToUint256(BigInt('0x' + amount*10**18));
      // console.log('amountuint256', amountUint256);
      const buyCoinParams = {
        coin_address, // token address
        amount: amountUint256,
      };
      console.log('buyCoinParams', buyCoinParams);

      const approveCall = {
        contractAddress: quote_address_token,
        entrypoint: 'approve',
        calldata: CallData.compile({
          address: addressContract,
          amount: amountUint256,
        }),
      };

      const buyCoinCall = {
        contractAddress: addressContract,
        entrypoint: 'buy_coin_by_quote_amount',
        calldata: CallData.compile({
          coin_address: buyCoinParams.coin_address,
          quote_amount: amountUint256,
        }),
      };

      const tx = await account?.execute([approveCall, buyCoinCall], undefined, {});
      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (e) {
      console.log('Error handleBuyCoins', e);
      return undefined;
    }
  };

  return {handleBuyCoins};
};
