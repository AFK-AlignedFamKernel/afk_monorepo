import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
// import {KEYS_ADDRESS} from '../../constants/contracts';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS } from 'common';
import { AccountInterface, cairo, CallData, constants, RpcProvider, uint256 } from 'starknet';

import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';

export const useNameservice = () => {
  const account = useAccount();
  const chain = useNetwork();
  // const chainId = chain?.chain?.id
  // console.log("chainId", chainId)
  // const provider = new RpcProvider({ nodeUrl: 'http://127.0.0.1:5050' });
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  // console.log("chainId", chainId)
  // const provider = rpcProvider?.provider ?? new RpcProvider({ nodeUrl:  process.env.EXPO_PUBLIC_PROVIDER_URL  });
  // const provider = rpcProvider?.provider ?? new RpcProvider();
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });

  const handleBuyUsername = async (
    account: AccountInterface,
    username: string,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract = contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    const key_contract = await prepareAndConnectContract(provider, addressContract);
    let quote_address;
    console.log('read nameservice asset');

    try {
      quote_address = await key_contract.get_quote_token_subscription();
    } catch (error) {
      console.log('Error get amount to paid', error);
    }

    const asset = await prepareAndConnectContract(
      provider,
      quote_address,
      account,
    );
    console.log('convert float');
    console.log('read amountToPaid');

    let amountToPaid;
    try {
      /** @TODO fix CORS issue */
      amountToPaid = await key_contract.get_subscription_price(username);
    } catch (error) {
      console.log('Error get amount to paid', error);
    }

    console.log('amount to paid', amountToPaid);

    const approveCall = {
      contractAddress: asset?.address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: amountToPaid ? cairo.uint256(amountToPaid) : cairo.uint256(1),
      }),
      // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
    };

    const claimedUsername = {
      contractAddress: addressContract,
      entrypoint: 'claim_username',
      calldata: CallData.compile({
        username: username,
      }),
      // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
    };

    console.log('claimedUsername', claimedUsername);

    const tx = await account?.execute([approveCall, claimedUsername], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx
  };

  return {
    handleBuyUsername,

  };
};
