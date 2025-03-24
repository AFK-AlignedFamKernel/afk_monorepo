/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';

import { useStyles } from '../../../../hooks';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  useProofsStorage,
} from '../../../../hooks/useStorageState';
import { useCashuContext } from '../../../../providers/CashuProvider';
import { formatCurrency } from '../../../../utils/helpers';
import stylesheet from './styles';
import { getProofs, ICashuInvoice, NostrKeyManager, storeProofs, useCashu, useCashuStore, useCreateWalletEvent, useGetCashuTokenEvents, useGetCashuWalletsInfo, useGetSpendingTokens } from 'afk_nostr_sdk';
import { randomUUID } from 'expo-crypto';
import { Proof, ProofState, CheckStateEnum, MeltQuoteState } from '@cashu/cashu-ts';
import { Button, Icon } from 'src/components';
import { invoicesApi, proofsApi, proofsByMintApi, proofsSpentsByMintApi, settingsApi } from 'src/utils/database';
import { usePayment } from 'src/hooks/usePayment';

export const Balance = () => {
  const { getUnitBalance, setActiveUnit, getUnitBalanceWithProofsChecked, wallet, activeMint, activeUnit } = useCashuContext()!;

  const styles = useStyles(stylesheet);
  const [alias, setAlias] = useState<string>('');
  const [currentUnitBalance, setCurrentUnitBalance] = useState<number | undefined>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceFetching, setIsBalanceFetching] = useState(false);
  const { value: mints } = useMintStorage();
  // const { value: activeMint } = useActiveMintStorage();
  const { value: activeUnitStorage, setValue: setActiveUnitStorage } = useActiveUnitStorage();
  const { value: proofs, setValue: setProofsStore } = useProofsStorage();


  const { handleReceivedInvoicePayment } = usePayment();
  const { data: tokensEvents } = useGetCashuTokenEvents();
  const { data: walletsInfo } = useGetCashuWalletsInfo();
  const { data: spendingEvents } = useGetSpendingTokens();
  // console.log("cashu walletsInfo", walletsInfo)
  // console.log("cashu tokensEvents", tokensEvents)
  // console.log("cashu spendingEvents", spendingEvents)

  useEffect(() => {

    const mint = mints.filter((mint) => mint.url === activeMint);
    if (mint.length === 1) {
      setAlias(mint[0].alias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMint]);

  const { setSeed, seed } = useCashuStore()

  const { mutateAsync: createWalletEvent } = useCreateWalletEvent();

  const [activeUnitUsed, setActiveUnitUsed] = useState<string>(activeUnit);
  const [activeMintUsed, setActiveMintUsed] = useState<string>(activeMint);
  const [isWebsocketProofs, setIsWebsocketProofs] = useState<boolean>(false);
  const [isWebsocketQuote, setIsWebsocketQuote] = useState<boolean>(false);



  useEffect(() => {
    console.log("activeMint", activeMint)
    console.log("activeUnit", activeUnit)


    const handleInit = async () => {
      const activeMintUrl = await settingsApi.get("ACTIVE_MINT", activeMint);
      console.log("activeMintUrl", activeMintUrl)
      const proofsByMint = await proofsByMintApi.getByMintUrl(activeMintUrl);
      console.log("proofsByMint", proofsByMint)

      const allProofs = await proofsByMintApi.getAll();
      console.log("allProofs", allProofs)

      setProofsStore(proofsByMint);
    }
    handleInit();
  }, [activeMint, activeUnit, wallet])
  const handleCreateWalletEvent = async () => {
    const nostrAccountStr = await NostrKeyManager.getAccountConnected();
    const nostrAccount = JSON.parse(nostrAccountStr);

    const id = randomUUID();
    // setWalletId(id);
    if (nostrAccount && nostrAccount?.seed) {

      setSeed(Buffer.from(nostrAccount?.seed, 'hex'))
      // NostrKeyManager.setAccountConnected(nostrAccount)
      // nostr event
      const event = await createWalletEvent({
        name: id,
        mints: mints.map((mint) => mint.url),
        privkey: nostrAccount?.seed,
      });
      console.log("event", event)
      return { event: event, id: id };
    }
    return { event: undefined, id: id };
  }

  useEffect(() => {

    if (walletsInfo?.pages?.length === 0) {
      handleCreateWalletEvent();
    }
  }, [walletsInfo, tokensEvents])

  const handleCurrencyChange = () => {
    const mintUnits = mints.filter((mint) => mint.url === activeMint)[0].units;
    const currentIndex = mintUnits.indexOf(activeUnit);
    const nextIndex = (currentIndex + 1) % mintUnits.length;
    setActiveUnitStorage(mintUnits[nextIndex]);
    setActiveUnit(mintUnits[nextIndex]);
  };

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


  const fetchBalanceData = async () => {
    try {
      if (isLoading) {
        return;
      }
      setCurrentUnitBalance(0);
      setIsLoading(true);

      console.log("fetchBalanceData")
      const mint = mints.filter((mint) => mint.url === activeMint)[0];
      const proofsStr = getProofs();
      const proofsStorage = JSON.parse(proofsStr);
      // const proofsMap: Proof[] = [...proofsStorage, ...proofs];
      const proofsMap: Proof[] = [];
      const proofsMapEvents: Proof[] = [];

      // const mergedProofs = await handleGetProofs();

      const activeMintUrl = await settingsApi.get("ACTIVE_MINT", activeMint);

      console.log("get proofsByMint", activeMint)
      const proofsByMint = await proofsByMintApi.getByMintUrl(activeMintUrl);
      console.log("proofsByMint", proofsByMint)

      console.log("calculateBalance",)
      // const balance = await getUnitBalanceWithProofsChecked(activeUnit, mint, mergedProofs);
      const balance = await getUnitBalance(activeUnit, mint, proofsByMint);
      // const balance = await getUnitBalance(activeUnit, mint, mergedProofs);
      console.log("balance", balance)
      setCurrentUnitBalance(balance);
      setIsLoading(false);

      if (wallet) {
        // await handleWebsocketProofs(proofsByMint)
      }

      setIsBalanceFetching(true);
    } catch (error) {
      console.log("fetchBalanceData error", error);
      setIsLoading(false);
      setIsBalanceFetching(true);
    } finally {
      setIsLoading(false);
      setIsBalanceFetching(true);
    }

  };


  const handleWebsocketProofs = async (mergedProofsParents?: Proof[]) => {
    try {
      console.log("handleWebsocketProofs")
      if (!wallet) {
        console.log("handleWebsocketProofs wallet not found")
        return { mergedProofs: [] as Proof[], data: {} }
      }

      let mergedProofs: Proof[] = mergedProofsParents || [];

      const activeMintUrl = await settingsApi.get("ACTIVE_MINT", activeMint);

      console.log("activeMintUrl", activeMintUrl)
      if (!mergedProofsParents) {
        mergedProofs = await proofsByMintApi.getByMintUrl(activeMintUrl);
      }

      console.log("handleWebsocketProofs mergedProofs", mergedProofs)
      // storeProofs(mergedProofs);
      await wallet?.loadMint();

      const data = await new Promise<ProofState>(async (res) => {
        try {
          if (wallet && wallet?.mint?.mintUrl === activeMint) {
            wallet?.onProofStateUpdates(
              mergedProofs,
              async (p) => {
                if (p.state === CheckStateEnum.SPENT) {
                  console.log("onProofStateUpdates p", p)
                  const proofsStr = getProofs();
                  const proofs = JSON.parse(proofsStr);
                  // console.log("onProofStateUpdates proofs", proofs)
                  console.log("onProofStateUpdates mergedProofs", mergedProofs)
                  let proofsFiltered = mergedProofs.filter((proof: Proof) => proof.C !== p?.proof?.C);

                  console.log("proofsFiltered", proofsFiltered)
                  proofsFiltered = Array.from(new Set(proofsFiltered.map((p) => p)));
                  console.log("data onProofStateUpdates proofsFiltered", proofsFiltered)

                  try {
                    console.log("update dexie db")
                    console.log("setAll proofsFiltered")
                    // await proofsApi.setAll([...proofsFiltered])
                    // await proofsByMintApi.setAllForMint(proofsFiltered, activeMintUrl)

                    // await proofsSpentsByMintApi.addProofsForMint([p?.proof], activeMintUrl)
                    // TODO create spending event
                    // update tokens events
                    // update storage proofs
                    // console.log("proofsFiltered", proofsFiltered)
                    storeProofs([...proofsFiltered]);
                    setProofsStore([...proofsFiltered]);

                  } catch (error) {
                    console.log("error setAll proofsFiltered", error)
                  }
                  res(p);

                }
              },
              (e) => {
                console.log(e);
              }
            );
            // wallet.swap(21, proofs);
          }
        } catch (error) {
          console.log("error websocket connection", error)

        }


      });
      setIsWebsocketProofs(true);
      console.log("data onProofStateUpdates proofs websocket", data)

      return { mergedProofs, data };
    } catch (error) {
      console.log("handleWebsocketProofs errror", error)
      return { mergedProofs: [] as Proof[], data: {} }
    } finally {
      setIsWebsocketProofs(true);
    }

  }


  const handleCheckQuoteWebsocket = async (mergedInvoicesParents?: ICashuInvoice[]) => {
    try {
      console.log("handleCheckQuoteWebsocket")
      if (!wallet) {
        console.log("handleCheckQuoteWebsocket wallet not found")
        return { mergedInvoices: [] as ICashuInvoice[], data: {} }
      }

      let mergedInvoices: ICashuInvoice[] = mergedInvoicesParents || [];

      console.log("handleCheckQuoteWebsocket mergedInvoicesParents", mergedInvoicesParents)
      const activeMintUrl = await settingsApi.get("ACTIVE_MINT", activeMint);

      console.log("activeMintUrl", activeMintUrl)
      if (!mergedInvoices?.length || mergedInvoices?.length == 0) {
        mergedInvoices = await invoicesApi.getAllUnpaid();
      }

      console.log("handleCheckQuoteWebsocket mergedInvoices", mergedInvoices)

      const quoteIds = mergedInvoices?.map((invoice) => invoice.bolt11);

      console.log("quoteIds", quoteIds)

      if (quoteIds?.length == 0) {
        return { mergedInvoices: [] as ICashuInvoice[], data: {} }
      }
      // storeProofs(mergedProofs);
      const data = await new Promise<ProofState>((res) => {
        try {
          if (wallet) {
            wallet?.onMeltQuoteUpdates(
              quoteIds,
              async (p) => {
                if (p?.state == MeltQuoteState?.PAID) {
                  console.log("onMeltQuoteUpdates p", p)
                  // await handleReceivedInvoicePayment(p);
                }

              },
              (e) => {
                console.log(e);
              }
            );
            // wallet.swap(21, proofs);
          }
        } catch (error) {
          console.log("error handleCheckQuoteWebsocket connection", error)

        }


      });
      setIsWebsocketQuote(true);
      console.log("data onProofStateUpdates proofs websocket", data)

      return { mergedInvoices, data };
    } catch (error) {
      console.log("handleWebsocketProofs errror", error)
      return { mergedInvoices: [] as ICashuInvoice[], data: {} }
    } finally {
      setIsWebsocketQuote(true);
    }

  }


  // useEffect(() => {
  //   console.log("activeUnit", activeUnit)
  //   if(activeUnit && activeMint && !isBalanceFetching) {
  //     fetchBalanceData();
  //   }

  //   if(wallet) {
  //   }
  // }, [activeUnit, activeMint, wallet])

  useEffect(() => {

    if (activeUnit && activeMint && !isBalanceFetching) {
      console.log("fetchBalanceData")
      setActiveUnitUsed(activeUnit);
      fetchBalanceData();
      setActiveUnitStorage(activeUnit);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [activeUnit, activeUnitUsed, isWebsocketProofs, proofs, mints, activeMint, tokensEvents, walletsInfo, wallet]);
  }, [activeUnit, mints, wallet, activeMint, tokensEvents, walletsInfo, isBalanceFetching, isLoading, isWebsocketQuote, isWebsocketProofs]);


  useEffect(() => {
    console.log("activeUnit", activeUnit)
    if (activeUnit && activeMint && (activeUnitUsed !== activeUnit || activeMintUsed !== activeMint)) {
      console.log("fetchBalanceData")
      setActiveUnitUsed(activeUnit);
      setActiveMintUsed(activeMint);
      fetchBalanceData();
      setActiveUnitStorage(activeUnit);
    }
    console.log("activeMint", activeMint)
  }, [activeUnit, activeMint, activeUnitUsed, activeMintUsed, isBalanceFetching])

  useEffect(() => {

    if (wallet && !isWebsocketProofs && wallet?.mint?.mintUrl === activeMint) {
      console.log("handleWebsocketProofs")
      // handleWebsocketProofs();
    }
  }, [wallet, isWebsocketProofs, activeMint])


  useEffect(() => {
    if (wallet && !isWebsocketQuote && wallet?.mint?.mintUrl === activeMint) {
      // console.log("handleCheckQuoteWebsocket")
      // handleCheckQuoteWebsocket();
    }
  }, [wallet, isWebsocketQuote, activeMint])

  // Helper function to diagnose and fix DB issues
  const handleDiagnoseDatabaseIssues = async () => {
    try {
      console.log("Running database diagnostics...");

      // Check invoices
      const allInvoices = await invoicesApi.getAll();
      console.log(`Total invoices: ${allInvoices.length}`);

      // Count invoices with missing request field
      const missingRequest = allInvoices.filter(inv => !inv.request);
      console.log(`Invoices with missing request field: ${missingRequest.length}`);

      if (missingRequest.length > 0) {
        console.log("Running invoice fix...");
        await invoicesApi.fixMissingRequestFields();

        // Verify fix worked
        const checkInvoices = await invoicesApi.getAll();
        const stillMissingRequest = checkInvoices.filter(inv => !inv.request);
        console.log(`Invoices still missing request field after fix: ${stillMissingRequest.length}`);
      }

      return {
        initialIssues: missingRequest.length,
        fixed: missingRequest.length > 0
      };
    } catch (error) {
      console.error("Error running database diagnostics:", error);
      return {
        initialIssues: -1,
        fixed: false,
        error
      };
    }
  };

  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceTitle}>Your balance</Text>
      <TouchableOpacity style={styles.currencyButton} onPress={handleCurrencyChange}>
        <Text style={styles.currencyButtonText}>{activeUnit.toUpperCase()}</Text>
      </TouchableOpacity>
      {activeUnit ? (
        <Text style={styles.balance}>
          {!isLoading ? formatCurrency(currentUnitBalance, activeUnit) : '...'}
        </Text>
      ) : null}
      <Text style={styles.activeMintText}>
        Connected to: <b>{alias}</b>
      </Text>

      {isBalanceFetching &&
        <View>
          <TouchableOpacity onPress={() => {
            setIsBalanceFetching(false);
            setIsWebsocketProofs(false);
            setIsWebsocketQuote(false);
          }}>
            <Icon name="ReloadIcon" size={20} />
            {/* Reload balance */}
          </TouchableOpacity>
        </View>
      }

      {/* Hidden diagnostic button, double tap to trigger */}
      <TouchableOpacity
        onPress={handleDiagnoseDatabaseIssues}
        style={{
          position: 'absolute',
          bottom: -20,
          right: 0,
          width: 20,
          height: 20,
          opacity: 0.01
        }}
      />
    </View>
  );
};
