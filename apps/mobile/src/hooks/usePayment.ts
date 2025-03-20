/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CashuMint, getDecodedToken, getEncodedToken, MintQuoteState, Proof, Token } from '@cashu/cashu-ts';
import {
  EventMarker,
  getProofs,
  ICashuInvoice,
  storeProofsSpent,
  useAuth,
  useCreateSpendingEvent,
  useCreateTokenEvent,
  useDeleteTokenEvents,
  useGetCashuTokenEvents,
} from 'afk_nostr_sdk';
import { useState } from 'react';

import { useCashuContext } from '../providers/CashuProvider';
import { useToast } from './modals';
import { useGetTokensByProofs } from './useGetTokensByProof';
import { useMintStorage, useProofsStorage, useTransactionsStorage, useWalletIdStorage } from './useStorageState';

export const usePayment = () => {
  const { showToast } = useToast();

  const { meltTokens, wallet, proofs: proofsStore, setProofs, activeUnit, activeMint, mintUrlSelected, connectCashWallet } = useCashuContext()!;
  const { publicKey, privateKey } = useAuth();

  const { value: proofsStorage, setValue: setProofsStorage } = useProofsStorage();
  const { value: transactions, setValue: setTransactions } = useTransactionsStorage();
  const { value: walletId } = useWalletIdStorage();

  const { mutateAsync: createTokenEvent } = useCreateTokenEvent();
  const { mutateAsync: createSpendingEvent } = useCreateSpendingEvent();
  const { deleteMultiple } = useDeleteTokenEvents();

  const [proofsFilter, setProofsFilter] = useState<Proof[]>([]);

  const { refetch: refetchTokens, events: filteredTokenEvents } = useGetTokensByProofs(proofsFilter);
  const { data: tokensEvents } = useGetCashuTokenEvents();

  const { value: mints } = useMintStorage();

  const handleGetProofs = async () => {
    const mint = mints.filter((mint) => mint.url === activeMint)[0];
    const proofsStr = getProofs();
    const proofsMap: Proof[] = [];
    const proofsMapEvents: Proof[] = [];
    let eventsProofs = tokensEvents?.pages[0]?.map((event: any) => {
      // let eventContent = JSON.parse(event.content);
      let eventContent = event.content;
      if (eventContent?.mint === activeMint) {
        eventContent?.proofs?.map((proof: any) => {
          proofsMap.push(proof);
          return proof;
        })
      }
    })

    // Create array of proofs from events by flattening and filtering out undefined/null
    const eventsProofsArray = eventsProofs?.flat().filter(Boolean) || [];

    // // Merge proofs arrays and filter out duplicates based on C value
    // const mergedProofs = [...proofsMap, ...eventsProofsArray].reduce((unique: Proof[], proof: Proof) => {
    //   // Only add if we haven't seen this C value before
    //   if (!unique.some(p => p.C === proof.C)) {
    //     unique.push(proof);
    //   }
    //   return unique;
    // }, []);

    // Merge proofs arrays and filter out duplicates based on C value
    const mergedProofs = [...proofsMap, ...eventsProofsArray].reduce((unique: Proof[], proof: Proof) => {
      // Only add if we haven't seen this C value before
      if (!unique.some(p => p.C === proof.C)) {
        unique.push(proof);
      }
      return unique;
    }, []);

    return mergedProofs;
  }
  const handlePayInvoice = async (pInvoice: string, proofsParent?: Proof[], amount?: number) => {
    if (!wallet) {
      console.log('no wallet');

      const cashuMint = new CashuMint(mintUrlSelected)
      const wallet = await connectCashWallet(cashuMint)
      return {
        meltResponse: undefined,
        invoice: undefined,
      };
    }

    const proofsStr = await getProofs()

    console.log('proofs', proofsStore);

    if (!proofsStr) {
      showToast({
        title: 'No proofs found',
        type: 'error',
      });
      return {
        meltResponse: undefined,
        invoice: undefined,
      }
    };
    let proofsStorage = JSON.parse(proofsStr)
    let proofs = proofsParent ? [...(JSON.parse(proofsStr)), ...proofsParent] : JSON.parse(proofsStr)
    console.log("handlePayInvoice proofs", proofs)

    if (proofs.length === 0) {
      proofs = proofsStore
    }
    if (proofs && proofs.length > 0) {

      try {
        console.log('proofs', proofs);

        // const amount = Number(pInvoice.match(/lnbc(\d+)n/)?.[1] ?? 0);
        // const amount = Number(1);
        // console.log('amount regex', amount);

        let proofsToSend = proofs;
        const fees = await wallet?.getFeesForKeyset(amount, activeUnit)

        console.log('fees', fees);
        if (amount) {

          const res = await wallet?.selectProofsToSend(proofs, amount+fees)
          // const checkProofsStates = await wallet?.checkProofsStates(proofs)
          console.log('res selectProofsToSend', res);
          // console.log('res checkProofsStates', checkProofsStates);

          proofsToSend=res?.send;

        }
        // console.log("res", res) 
        console.log('proofsToSend', proofsToSend);


        // const keysets = await wallet.getKeySets()
        // console.log('keysets', keysets);
        // const meltQuote = await wallet.checkMeltQuote(pInvoice);
        const response = await meltTokens(pInvoice, proofsToSend);
        console.log('response', response);

        if (!response) {
          showToast({
            title: 'Not enough proofs or amount',
            type: 'error',
          });
          return {
            meltResponse: undefined,
            invoice: undefined,
          }
        }
        // const res = await wallet.selectProofsToSend(proofs, response?.meltQuote.amount)

        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(response?.meltQuote.amount, res?.send);
        if (response) {
          const { meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs } = response;
          setProofsFilter(selectedProofs);
          if (privateKey && publicKey) {
            try {
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
                events: [...destroyedEvents, { id: tokenEvent.id, marker: 'created' as EventMarker }],
              });         
            } catch (error) {
              console.log("Error",error)
            }
     
          }
          showToast({
            title: 'Payment sent.',
            type: 'success',
          });
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);
          // Stored proofs spent
          storeProofsSpent([...(meltResponse?.change as Proof[])]);
          const newInvoice: ICashuInvoice = {
            amount: -(meltQuote.amount + meltQuote.fee_reserve),
            bolt11: pInvoice,
            quote: meltQuote.quote,
            date: Date.now(),
            state: MintQuoteState.PAID,
            direction: 'out',
          };
          setTransactions([...transactions, newInvoice]);
          return { meltResponse, invoice: newInvoice };
        } else {
          return { meltResponse: undefined, invoice: undefined };
        }
      } catch (error) {
        console.log('error', error);
        return { meltResponse: undefined, invoice: undefined };
      }
    } else {
      console.log('no proofs');
      // no proofs = no balance
      return {
        meltResponse: undefined,
        invoice: undefined,
      };
    }
  };

  const handleGenerateEcash = async (amount: number, proofsParent?: Proof[]) => {
    try {
      console.log("handleGenerateEcash", amount, proofsParent)
      if (!amount) {
        return {cashuToken: undefined, proofsToSend: undefined};
      }

      if (!wallet) {
        return {cashuToken: undefined, proofsToSend: undefined};
      }
      const proofsStr = await getProofs()

      console.log('proofs', proofsStore);

      if (!proofsStr && !proofsParent) {
        showToast({
          title: 'No proofs found',
          type: 'error',
        });
        return {cashuToken: undefined, proofsToSend: undefined};
      };
      const proofs = proofsParent ? [...(JSON.parse(proofsStr)), ...proofsParent] : JSON.parse(proofsStr)

      if (proofs) {
        // const proofsCopy = Array.from(proofs);
        const proofsCopy = proofs;

        const availableAmount = proofsCopy.reduce((s: number, t: Proof) => (s += t.amount), 0);

        console.log("proofsCopy", proofsCopy)
        if (availableAmount < amount) {
          return {cashuToken: undefined, proofsToSend: undefined};
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

        const res = await wallet.selectProofsToSend(proofs, amount)

        console.log('res', res);
        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, selectedProofs, {includeFees:true});
        const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, res?.send);
        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, res?.send);
        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, res?.send);
        console.log('proofsToKeep', proofsToKeep);
        console.log('proofsToSend', proofsToSend);

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
              events: [...destroyedEvents, { id: tokenEvent.id, marker: 'created' as EventMarker }],
            });
          }
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);

          // Stored proofs spent
          storeProofsSpent([...(res?.send as Proof[])]);


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
            return {cashuToken, proofsToSend};
          } else {
            return {cashuToken: undefined, proofsToSend: undefined};
          }
        }
        return {cashuToken: undefined, proofsToSend: undefined} ;
      }

      return {cashuToken: undefined, proofsToSend: undefined};
    } catch (e) {
      console.log("handleGenerateEcash error", e)
      return {cashuToken: undefined, proofsToSend: undefined};
    }
  };

  const handleReceiveEcash = async (ecashToken?: string) => {
    try {
      console.log('handleReceiveEcash', ecashToken);
      if (!ecashToken) {
        return undefined;
      }
      const decodedToken = getDecodedToken(ecashToken);
      console.log('decodedToken', decodedToken);
      console.log('wallet', wallet);
      const keysets = await wallet?.getKeySets()
      console.log('keysets', keysets);
      const receiveEcashProofs = await wallet?.receive(decodedToken, {
        keysetId: keysets[0].id,
        // keys: keysets[0].keys,
      });
      console.log('receiveEcashProofs', receiveEcashProofs);
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
            events: [{ id: tokenEvent.id, marker: 'created' }],
          });
        }

        showToast({ title: 'Ecash received.', type: 'success' });
        setProofs([...proofsStorage, ...receiveEcashProofs]);
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
      console.log('handleReceiveEcash error', e);
      return undefined;
    }
  };

  return {
    handlePayInvoice,
    handleGenerateEcash,
    handleReceiveEcash,
    handleGetProofs
  };
};
