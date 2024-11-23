/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {getDecodedToken, getEncodedToken, MintQuoteState, Token} from '@cashu/cashu-ts';
import {ICashuInvoice, useCreateSpendingEvent, useCreateTokenEvent} from 'afk_nostr_sdk';

import {useCashuContext} from '../providers/CashuProvider';
import {useToast} from './modals';
import {useProofsStorage, useTransactionsStorage, useWalletIdStorage} from './useStorageState';

export const usePayment = () => {
  const {showToast} = useToast();

  const {meltTokens, wallet, proofs, setProofs, activeUnit, activeMint} = useCashuContext()!;

  const {value: proofsStorage, setValue: setProofsStorage} = useProofsStorage();
  const {value: transactions, setValue: setTransactions} = useTransactionsStorage();
  const {value: walletId} = useWalletIdStorage();

  const {mutateAsync: createTokenEvent} = useCreateTokenEvent();
  const {mutateAsync: createSpendingEvent} = useCreateSpendingEvent();

  const handlePayInvoice = async (pInvoice: string) => {
    if (!wallet) {
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
            return undefined;
          }
        } catch (error) {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      // no proofs = no balance
      return undefined;
    }
  };

  const handleGenerateEcash = async (amount: number) => {
    try {
      if (!amount) {
        return undefined;
      }

      if (!wallet) {
        return undefined;
      }

      if (proofs) {
        const proofsSpent = await wallet.checkProofsSpent(proofs);
        let proofsCopy = Array.from(proofs);

        if (proofsSpent) {
          proofsCopy = proofsCopy?.filter((p) => !proofsSpent?.includes(p));
        }

        const availableAmount = proofsCopy.reduce((s, t) => (s += t.amount), 0);

        if (availableAmount < amount) {
          return undefined;
        }

        const {returnChange: proofsToKeep, send: proofsToSend} = await wallet.send(
          amount,
          proofsCopy,
        );

        if (proofsToKeep && proofsToSend) {
          setProofs(proofsToKeep);
          setProofsStorage(proofsToKeep);

          const token = {
            token: [{proofs: proofsToSend, mint: activeMint}],
            activeUnit,
          } as Token;

          const cashuToken = getEncodedToken(token);

          if (cashuToken) {
            const newInvoice: ICashuInvoice = {
              amount: -amount,
              date: Date.now(),
              state: MintQuoteState.PAID,
              direction: 'out',
              bolt11: cashuToken,
            };
            setTransactions([...transactions, newInvoice]);
            return cashuToken;
          } else {
            return undefined;
          }
        }
        return undefined;
      }

      return undefined;
    } catch (e) {
      return undefined;
    }
  };

  const handleReceiveEcash = async (ecashToken?: string) => {
    try {
      if (!ecashToken) {
        return undefined;
      }
      const decodedToken = getDecodedToken(ecashToken);

      const receiveEcashProofs = await wallet?.receive(decodedToken);

      if (receiveEcashProofs?.length > 0) {
        const tokenEvent = await createTokenEvent({
          walletId,
          mint: activeMint,
          proofs: receiveEcashProofs,
        });

        const proofsAmount = receiveEcashProofs.reduce((acc, item) => acc + item.amount, 0);

        await createSpendingEvent({
          walletId,
          direction: 'in',
          amount: proofsAmount.toString(),
          unit: activeUnit,
          events: [{id: tokenEvent.id, marker: 'created'}],
        });

        showToast({title: 'Ecash received.', type: 'success'});
        setProofs([...proofs, ...receiveEcashProofs]);
        setProofsStorage([...proofsStorage, ...receiveEcashProofs]);

        const newTx: ICashuInvoice = {
          amount: proofsAmount,
          date: Date.now(),
          state: MintQuoteState.PAID,
          direction: 'in',
          bolt11: ecashToken,
        };
        setTransactions([...transactions, newTx]);
        return newTx;
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  };

  return {
    handlePayInvoice,
    handleGenerateEcash,
    handleReceiveEcash,
  };
};
