/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {getEncodedToken, MintQuoteState, Proof, Token} from '@cashu/cashu-ts';
import {ICashuInvoice} from 'afk_nostr_sdk';

import {useCashuContext} from '../providers/CashuProvider';
import {useToast} from './modals';
import {useProofsStorage, useTransactionsStorage} from './useStorageState';

export const usePayment = () => {
  const {showToast} = useToast();

  const {meltTokens, wallet, proofs, setProofs} = useCashuContext()!;

  const {setValue: setProofsStorage} = useProofsStorage();
  const {value: transactions, setValue: setTransactions} = useTransactionsStorage();

  const handlePayInvoice = async (pInvoice: string) => {
    if (!wallet) {
      showToast({
        type: 'error',
        title: 'An error has ocurred.',
      });
      return undefined;
    } else if (proofs) {
      const proofsSpent = await wallet.checkProofsSpent(proofs);
      let proofsCopy = Array.from(proofs);

      if (proofsSpent) {
        proofsCopy = proofsCopy?.filter((p) => !proofsSpent?.includes(p));
      }

      if (proofsCopy.length > 0) {
        try {
          const response = await meltTokens(pInvoice, proofsCopy);
          if (response) {
            const {meltQuote, meltResponse, proofsToKeep} = response;
            showToast({
              title: 'Payment sent.',
              type: 'success',
            });
            setProofs(proofsToKeep);
            setProofsStorage(proofsToKeep);
            const newInvoice: ICashuInvoice = {
              amount: -(meltQuote.amount + meltQuote.fee_reserve),
              bolt11: pInvoice,
              quote: meltQuote.quote,
              date: Date.now(),
              state: MintQuoteState.PAID,
              direction: 'out',
            };
            setTransactions([...transactions, newInvoice]);
            return meltResponse;
          } else {
            showToast({
              type: 'error',
              title: 'An error has ocurred',
            });
            return undefined;
          }
        } catch (error) {
          showToast({
            type: 'error',
            title: 'An error has ocurred',
          });
          return undefined;
        }
      } else {
        showToast({
          type: 'error',
          title: 'An error has ocurred.',
        });
        return undefined;
      }
    } else {
      // no proofs = no balance
      showToast({
        type: 'error',
        title: 'An error has ocurred.',
      });
      return undefined;
    }
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

      if (proofs) {
        const proofsSpent = await wallet?.checkProofsSpent(proofs);
        console.log('proofsSpent', proofsSpent);

        const proofsFiltered = proofs?.filter((p) => {
          if (!proofsSpent?.includes(p)) {
            return p;
          }
        });
        console.log('proofs', proofsFiltered);
        const proofsToUsed: Proof[] = [];
        const totalAmount = proofsFiltered.reduce((s, t) => (s += t.amount), 0);
        console.log('totalAmount', totalAmount);

        let amountCounter = 0;
        // eslint-disable-next-line no-unsafe-optional-chaining
        for (const p of proofsFiltered?.reverse()) {
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
