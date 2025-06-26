import {useNetwork} from '@starknet-react/core';
// import {KEYS_ADDRESS} from '../../constants/contracts';
import {KEYS_ADDRESS} from 'common';
import {AccountInterface, CallData, constants} from 'starknet';

export const useInstantiateKeys = () => {
  const chain = useNetwork();
  const chainId = chain?.chain?.id;

  const handleInstantiateKeys = async (account: AccountInterface, addressContract?: string) => {
    if (!account) return;

    const contractAddress = addressContract ?? KEYS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

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
