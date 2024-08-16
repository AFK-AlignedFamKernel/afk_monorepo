import {useAccount, useNetwork} from '@starknet-react/core';
import {AccountInterface, CallData, constants} from 'starknet';

import { LAUNCHPAD_ADDRESS} from '../../constants/contracts';

export const useInstantiateKeys = () => {
  const chain = useNetwork();
  const chainId = chain?.chain?.id;

  const handleInstantiateKeys = async (account: AccountInterface, addressContract?: string) => {
    if (!account) return;

    const contractAddress = addressContract ?? LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

    const call = {
      contractAddress,
      entrypoint: 'instantiate_keys',
      calldata: CallData.compile({}),
    };

    console.log('Call', call);

    const tx = await account?.execute([call], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
  };

  return {handleInstantiateKeys};
};
