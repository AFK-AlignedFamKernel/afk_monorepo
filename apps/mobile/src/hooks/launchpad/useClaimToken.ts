import { LAUNCHPAD_ADDRESS } from 'common';
import { AccountInterface, cairo, CairoCustomEnum, CallData, constants } from 'starknet';

export type DeployClaimTokenFormValues = {
  coin_address: string;
};

export const useClaimToken = () => {
  const claimToken = async (account: AccountInterface, data: DeployClaimTokenFormValues) => {
    try {

      const deployCall = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'claim_coin_all',
        calldata: CallData.compile({
          coin_address: data.coin_address,
        }),
      };
      console.log('deployCall', deployCall);

      const tx = await account.execute(deployCall);
      console.log('tx', tx);

      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error claim token', error);
      return Promise.reject(error);
    }
  };


  return {
    claimToken
  };
};
