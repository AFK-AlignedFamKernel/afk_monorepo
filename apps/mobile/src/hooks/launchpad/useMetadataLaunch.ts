import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, cairo, CairoCustomEnum, CallData, constants} from 'starknet';

// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import {formatFloatToUint256} from '../../utils/format';
import {BondingType} from '../../types/keys';
import { byteArray } from 'starknet';

export type DeployTokenFormValues = {
  coin_address: string;
  recipient?: string;
  contract_address_salt: string | undefined;
  is_unruggable?: boolean;
  bonding_type?: BondingType;
  metadata?: string | undefined;
  image?: string | undefined;
  nostr_event_id?: string | undefined;
};

export const useMetadataLaunch = () => {
  const addMetadata = async (account: AccountInterface, data: DeployTokenFormValues) => {
    try {
      // const CONTRACT_ADDRESS_SALT_DEFAULT =
      //   data?.contract_address_salt ??
      //     (await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
      //     ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
      //     : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6';

      console.log('deployCall');

      const urlMetadata= byteArray.byteArrayFromString(data.metadata ?? 'LFG')
      const urlImage= byteArray.byteArrayFromString(data.image ?? 'LFG')
      const nostrEventId= byteArray.byteArrayFromString(data.nostr_event_id ?? 'LFG')
      
      const metadataLaunch = CallData.compile({
        token_address: data.coin_address,
        url: urlMetadata,
        nostr_event_id: nostrEventId,
      })
      const metadataCall     = {
        contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        entrypoint: 'add_metadata',
        calldata: CallData.compile({
          coin_address: data.coin_address,
          owner: data?.recipient ?? account?.address,
          metadata: metadataLaunch,
        }),
      };
      console.log('metadataCall', metadataCall);

      const tx = await account.execute(metadataCall);
      console.log('tx', tx);

      console.log('tx hash', tx.transaction_hash);
      const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      return wait_tx;
    } catch (error) {
      console.log('Error metadata token', error);
      return Promise.reject(error);
    }
  };


  return {
    addMetadata,
  };
};
