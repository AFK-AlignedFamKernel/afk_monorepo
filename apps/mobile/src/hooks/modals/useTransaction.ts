import {InjectedConnector, useAccount, useExplorer, useSendTransaction} from '@starknet-react/core';
import {useEffect, useState} from 'react';
import {Call} from 'starknet';

import {useToast} from './useToast';
import {useTransactionModal} from './useTransactionModal';

interface UseTransactionInterface {
  callsProps?: Call[];
}
export const useTransaction = ({callsProps=[]}: UseTransactionInterface) => {
  const {show: showTransactionModal, hide: hideTransactionModal, shown} = useTransactionModal();
  // const {writeAsync} = useContractWrite({});

  const {showToast} = useToast();
  const [calls, setCalls] = useState<Call[]>(callsProps ?? []);

  const explorer = useExplorer();
  const kakarotScanTxUrl = 'https://sepolia.kakarotscan.org/tx/';
  const [txUrl, setTxUrl] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const {address, isConnected, connector} = useAccount();
  let walletType;
  if (connector instanceof InjectedConnector) {
    walletType = 0;
  } else {
    walletType = 1;
  }
  const {send: sendTransactionTx, data, isPending, isError, error} = useSendTransaction({calls});

  useEffect(() => {
    if (!data) return;
    if (walletType === 0) {
      setTxUrl(explorer.transaction(data!.transaction_hash));
    } else {
      //TODO: fix returned data to be akin to InvokeTransactionResult
      setTxUrl(kakarotScanTxUrl + data);
      showTransactionModal(data?.transaction_hash, () => {});
    }
  }, [data]);

  const sendTransaction = async (callsInputs?: Call[]) => {
    if (shown) return;

    if (!callsInputs && calls?.length == 0) {
      showToast({
        title: 'Impossible to create your TX',
        type: 'info',
      });
      return;
    }

    if (callsInputs) {
      setCalls(callsInputs);
    }

    showTransactionModal();

    try {
      // const {transaction_hash} = await writeAsync(args)
      const transaction_hash = await sendTransactionTx();

      setTxHash(transaction_hash)
      return {
        isOk:true,
        transaction_hash
      };
      // return new Promise<GetTransactionReceiptResponse>((resolve) => {
      //   showTransactionModal(transaction_hash, resolve);
      // });
    } catch (error) {
      hideTransactionModal();
      return {
        transaction_hash:undefined,
        isOk:false
      };
    }
  };

  return {
    sendTransaction,
    txUrl,
    txHash
  };
};
