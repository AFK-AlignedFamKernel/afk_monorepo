import {useAccount, useNetwork, useProvider} from '@starknet-react/core';
import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, CallData, constants, RpcProvider, uint256} from 'starknet';

import {TokenQuoteBuyKeys} from '../../types/keys';
import {formatFloatToUint256} from '../../utils/format';

export const useSellCoin = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = rpcProvider?.provider ?? new RpcProvider();

  const handleSellCoins = async (
    account: AccountInterface,
    user_address: string,
    amount: number,
    tokenQuote?: TokenQuoteBuyKeys,
    contractAddress?: string,
  ) => {
    if (!account) return;
    const addressContract = contractAddress ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    // console.log('addressContract', addressContract);
    // let launchpad_contract = await prepareAndConnectContract(
    //     provider,
    //     addressContract,
    //     account
    // );

    let amountUint256 = formatFloatToUint256(amount);
    // amountUint256 = uint256.bnToUint256(BigInt('0x' + amount));

    const sellKeysParams = {
      user_address, // token address
      amount: amountUint256,
      // amount: cairo.uint256(amount), // amount int. Float need to be convert with bnToUint
    };
    console.log('sellKeysParams', sellKeysParams);

    const call = {
      contractAddress: addressContract,
      entrypoint: 'sell_coin',
      calldata: CallData.compile({
        user_address: sellKeysParams.user_address,
        amount: sellKeysParams.amount,
      }),
    };

    console.log('Call', call);
    const tx = await account?.execute([call], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
  };

  return {handleSellCoins};
};
