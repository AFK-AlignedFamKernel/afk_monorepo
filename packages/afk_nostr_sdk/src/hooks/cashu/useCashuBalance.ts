import {Proof} from '@cashu/cashu-ts';
import {useEffect, useMemo, useState} from 'react';

import {getProofs} from '../../storage';
import {useCashuStore} from '../../store';
import {ProofInvoice} from '../../types';
import {useCashu} from './useCashu';

export const useCashuBalance = () => {
  const {wallet, mint: mintState, mintUrl, connectCashMint, connectCashWallet} = useCashu();
  const {mintUrl: mintUrlStore, setMintUrl: setMintUrlStore, setActiveBalance} = useCashuStore();

  const [balance, setBalance] = useState<number>(0);
  const balanceMemo = useMemo(() => {
    return balance;
  }, [balance, setBalance]);

  const transformProofSpentToTx = (proofs: Proof[]): ProofInvoice[] => {
    return proofs.map((c) => {
      return {
        date: new Date().getTime(),
        direction: 'out',
        ...c,
      };
    });
  };

  useEffect(() => {
    getProofsWalletAndBalance();
  }, [mintUrl]);

  const getProofsWalletAndBalance = async () => {
    console.log('getProofsWalletAndBalance');
    const proofsLocal = getProofs();
    if (proofsLocal) {
      /** TODO clean proofs */
      let proofs: ProofInvoice[] = JSON.parse(proofsLocal);
      const proofsSpent = await wallet?.checkProofsSpent(proofs);
      const {mint, keys} = await connectCashMint(mintUrlStore ?? mintUrl);
      const keyssets = await mint?.getKeySets();
      console.log('keyssets', keyssets);

      proofs = proofs?.filter(
        (p) => !proofsSpent?.includes(p) && keyssets?.keysets?.find((k) => k?.id === p?.id),
      );

      const totalAmount = proofs.reduce((s, t) => (s += t.amount), 0);
      console.log('totalAmount', totalAmount);
      setBalance(totalAmount);
      setActiveBalance(totalAmount);
      return totalAmount;
    }
    return 0;
  };

  return {
    balance,
    setBalance,
    getProofsWalletAndBalance,
    balanceMemo,
  };
};
