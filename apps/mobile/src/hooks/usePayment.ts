/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {getEncodedToken, Proof, Token} from '@cashu/cashu-ts';

import {useCashuContext} from '../providers/CashuProvider';
import {useToast} from './modals';
import {useProofsStorage} from './useStorageState';

export const usePayment = () => {
  const {showToast} = useToast();

  const {meltTokens, wallet} = useCashuContext()!;
  const {value: proofsLocal} = useProofsStorage();

  const handlePayInvoice = async (invoice?: string) => {
    if (!invoice) return undefined;
    console.log('[PAY] invoice', invoice);

    if (proofsLocal) {
      console.log('[PAY] proofsLocal', proofsLocal);
      const proofsSpent = await wallet?.checkProofsSpent(proofsLocal);
      console.log('[PAY] proofsSpent', proofsSpent);
      let proofs = Array.from(proofsLocal);
      console.log('[PAY] proofs', proofs);

      if (proofsSpent) {
        proofs = proofs?.filter((p) => !proofsSpent?.includes(p));
      }
      console.log('[PAY] proofsFilter', proofs);
      const lenProof = proofs?.length;

      if (lenProof && proofs) {
        try {
          const tokens = await meltTokens(invoice, proofs?.slice(lenProof - 1, lenProof));
          showToast({
            title: 'Payment send',
            type: 'success',
          });
          return tokens;
        } catch (error) {
          showToast({
            type: 'error',
            title: 'An error has ocurred',
          });
        }
      }
    } else {
      try {
        const tokens = await meltTokens(invoice);
        showToast({
          title: 'Payment send',
          type: 'success',
        });
        return tokens;
      } catch (error) {
        showToast({
          type: 'error',
          title: 'An error has ocurred',
        });
      }
    }

    return [];
  };

  const handleGenerateEcash = async (amount: number) => {
    try {
      if (!amount) {
        showToast({title: 'Please add a mint amount', type: 'info'});
        return undefined;
      }

      if (!wallet) {
        showToast({title: 'Please connect your wallet', type: 'error'});
        return undefined;
      }

      if (proofsLocal) {
        let proofs: Proof[] = proofsLocal;

        const proofsSpent = await wallet?.checkProofsSpent(proofs);
        console.log('proofsSpent', proofsSpent);

        proofs = proofs?.filter((p) => {
          if (!proofsSpent?.includes(p)) {
            return p;
          }
        });
        console.log('proofs', proofs);
        const proofsToUsed: Proof[] = [];
        const totalAmount = proofs.reduce((s, t) => (s += t.amount), 0);
        console.log('totalAmount', totalAmount);

        let amountCounter = 0;
        for (const p of proofs?.reverse()) {
          amountCounter += p?.amount;
          proofsToUsed.push(p);

          if (amountCounter >= amount) {
            break;
          }
        }

        const sendCashu = await wallet?.send(amount, proofsToUsed);
        console.log('sendCashu', sendCashu);

        if (sendCashu) {
          const keysets = await wallet?.mint?.getKeySets();
          // unit of keysets
          const unit = keysets?.keysets[0].unit;

          const token = {
            token: [{proofs: proofsToUsed, mint: wallet?.mint?.mintUrl}],
            unit,
          } as Token;
          console.log('keysets', keysets);
          console.log('proofsToUsed', proofsToUsed);
          console.log('token', token);

          const cashuToken = getEncodedToken(token);
          console.log('cashuToken', cashuToken);
          // setCashuTokenCreated(cashuToken)

          showToast({title: 'Cashu created', type: 'success'});

          return cashuToken;
        }
        return undefined;
      }

      return undefined;
    } catch (e) {
      console.log('Error generate cashu token', e);
      showToast({title: 'Error when generate cashu token', type: 'error'});
      return undefined;
    }
  };

  return {
    handlePayInvoice,
    handleGenerateEcash,
  };
};
