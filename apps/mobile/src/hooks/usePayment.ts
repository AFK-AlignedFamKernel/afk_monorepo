/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {getDecodedToken, getEncodedToken, MintQuoteState, Proof, Token} from '@cashu/cashu-ts';
import {
  ICashuInvoice,
  useAuth,
  useCreateSpendingEvent,
  useCreateTokenEvent,
  useDeleteTokenEvents,
} from 'afk_nostr_sdk';
import {EventMarker} from 'afk_nostr_sdk/src/hooks/cashu/useCreateSpendingEvent';
import {useState} from 'react';

import {useCashuContext} from '../providers/CashuProvider';
import {useToast} from './modals';
import {useGetTokensByProofs} from './useGetTokensByProof';
import {useProofsStorage, useTransactionsStorage, useWalletIdStorage} from './useStorageState';

export const usePayment = () => {
  const {showToast} = useToast();

  const {meltTokens, wallet, proofs, setProofs, activeUnit, activeMint} = useCashuContext()!;
  const {publicKey, privateKey} = useAuth();

  const {value: proofsStorage, setValue: setProofsStorage} = useProofsStorage();
  const {value: transactions, setValue: setTransactions} = useTransactionsStorage();
  const {value: walletId} = useWalletIdStorage();

  const {mutateAsync: createTokenEvent} = useCreateTokenEvent();
  const {mutateAsync: createSpendingEvent} = useCreateSpendingEvent();
  const {deleteMultiple} = useDeleteTokenEvents();

  const [proofsFilter, setProofsFilter] = useState<Proof[]>([]);

  const {refetch: refetchTokens, events: filteredTokenEvents} = useGetTokensByProofs(proofsFilter);

  const handlePayInvoice = async (pInvoice: string) => {
    if (!wallet) {
      return undefined;
    } else if (proofs) {
      try {
        const response = await meltTokens(pInvoice, proofs);
        if (response) {
          const {meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs} = response;
          setProofsFilter(selectedProofs);
          if (privateKey && publicKey) {
            await refetchTokens();
            await deleteMultiple(
              filteredTokenEvents.map((event) => event.id),
              'proofs spent in transaction',
            );
            const tokenEvent = await createTokenEvent({
              walletId,
              mint: activeMint,
              proofs: proofsToKeep,
            });
            const destroyedEvents = filteredTokenEvents.map((event) => ({
              id: event.id,
              marker: 'destroyed' as EventMarker,
            }));
            await createSpendingEvent({
              walletId,
              direction: 'out',
              amount: (meltQuote.amount + meltQuote.fee_reserve).toString(),
              unit: activeUnit,
              events: [...destroyedEvents, {id: tokenEvent.id, marker: 'created' as EventMarker}],
            });
          }
          showToast({
            title: 'Payment sent.',
            type: 'success',
          });
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);
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
        const proofsCopy = Array.from(proofs);

        const availableAmount = proofsCopy.reduce((s, t) => (s += t.amount), 0);

        if (availableAmount < amount) {
          return undefined;
        }

        //selectProofs
        const selectedProofs: Proof[] = [];
        const remainingProofs: Proof[] = [];
        let proofsAmount = 0;
        for (let i = 0; i < proofsCopy.length; i++) {
          if (proofsAmount >= amount) {
            remainingProofs.push(proofsCopy[i]);
          } else {
            selectedProofs.push(proofsCopy[i]);
            proofsAmount += proofsCopy[i].amount;
          }
        }

        const {keep: proofsToKeep, send: proofsToSend} = await wallet.send(amount, selectedProofs);

        if (proofsToKeep && proofsToSend) {
          if (privateKey && publicKey) {
            await refetchTokens();
            await deleteMultiple(
              filteredTokenEvents.map((event) => event.id),
              'proofs spent in transaction',
            );
            const tokenEvent = await createTokenEvent({
              walletId,
              mint: activeMint,
              proofs: proofsToKeep,
            });
            const destroyedEvents = filteredTokenEvents.map((event) => ({
              id: event.id,
              marker: 'destroyed' as EventMarker,
            }));
            await createSpendingEvent({
              walletId,
              direction: 'out',
              amount: amount.toString(),
              unit: activeUnit,
              events: [...destroyedEvents, {id: tokenEvent.id, marker: 'created' as EventMarker}],
            });
          }
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);

          const token = {
            mint: activeMint,
            proofs: proofsToSend,
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
        const proofsAmount = receiveEcashProofs.reduce((acc, item) => acc + item.amount, 0);
        if (privateKey && publicKey) {
          const tokenEvent = await createTokenEvent({
            walletId,
            mint: activeMint,
            proofs: receiveEcashProofs,
          });

          await createSpendingEvent({
            walletId,
            direction: 'in',
            amount: proofsAmount.toString(),
            unit: activeUnit,
            events: [{id: tokenEvent.id, marker: 'created'}],
          });
        }

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
