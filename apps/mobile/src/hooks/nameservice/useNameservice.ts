import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
// import {KEYS_ADDRESS} from '../../constants/contracts';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS } from 'common';
import { AccountInterface, cairo, CallData, constants, RpcProvider, uint256 } from 'starknet';

import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';

export const useNameservice = () => {
  const { provider: rpcProvider } = useProvider();
  
  const provider = rpcProvider ?? new RpcProvider({ 
    nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL 
  });

  const prepareBuyUsername = async (
    account: AccountInterface,
    username: string,
    contractAddress?: string,
  ) => {
    if (!account) throw new Error('No account connected');
    if (!provider) throw new Error('Provider not initialized');

    try {
      const addressContract = contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
      const nameservice = await prepareAndConnectContract(provider, addressContract);
      
      // Default to STRK token
      const quote_address = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
      
      const asset = await prepareAndConnectContract(
        provider,
        quote_address,
        account,
      );

      let amountToPaid;
      try {
        // Call without arguments since the contract expects 0 args
        amountToPaid = await nameservice.get_subscription_price();
      } catch (error) {
        throw new Error(`Failed to get subscription price: ${error.message}`);
      }

      return [
        {
          contractAddress: asset?.address,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountToPaid ? cairo.uint256(amountToPaid) : cairo.uint256(1),
          }),
        },
        {
          contractAddress: addressContract,
          entrypoint: 'claim_username',
          calldata: CallData.compile({
            username: username
          }),
        }
      ];
    } catch (error) {
      console.error('Transaction preparation error:', error);
      throw error;
    }
  }

  return { prepareBuyUsername };
};
