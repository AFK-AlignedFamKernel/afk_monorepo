/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
import { getProofs, NostrKeyManager, storeProofs, useCashu, useCashuStore, useCreateWalletEvent, useGetCashuTokenEvents, useGetCashuWalletsInfo, useGetSpendingTokens } from 'afk_nostr_sdk';
import { randomUUID } from 'expo-crypto';
import { Check, ProofStateStateEnum, Proof, ProofState, CheckStateEnum } from '@cashu/cashu-ts';

export const Balance = () => {
  const { getUnitBalance, setActiveUnit, getUnitBalanceWithProofsChecked, wallet } = useCashuContext()!;

  const styles = useStyles(stylesheet);
  const [alias, setAlias] = useState<string>('');
  const [currentUnitBalance, setCurrentUnitBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceFetching, setIsBalanceFetching] = useState(false);
  const { value: mints } = useMintStorage();
  const { value: activeMint } = useActiveMintStorage();
  const { value: activeUnit, setValue: setActiveUnitStorage } = useActiveUnitStorage();
  const { value: proofs } = useProofsStorage();

  const { data: tokensEvents } = useGetCashuTokenEvents();
  const { data: walletsInfo } = useGetCashuWalletsInfo();
  const { data: spendingEvents } = useGetSpendingTokens();
  console.log("cashu walletsInfo", walletsInfo)
  console.log("cashu tokensEvents", tokensEvents)
  console.log("cashu spendingEvents", spendingEvents)
  useEffect(() => {

    const mint = mints.filter((mint) => mint.url === activeMint);
    if (mint.length === 1) {
      setAlias(mint[0].alias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMint]);

  const { setSeed, seed } = useCashuStore()

  const { mutateAsync: createWalletEvent } = useCreateWalletEvent();


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

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setIsLoading(true);
        console.log("fetchBalanceData")
        const mint = mints.filter((mint) => mint.url === activeMint)[0];
  
        const proofsMap: Proof[] = proofs || [];
        let eventsProofs = tokensEvents?.pages[0]?.map((event:any) => {
          // let eventContent = JSON.parse(event.content);
          let eventContent = event.content;
          eventContent?.proofs?.map((proof: any) => {
            proofsMap.push(proof);
            return proof;
          })
        })
  
        // Create array of proofs from events by flattening and filtering out undefined/null
        const eventsProofsArray = eventsProofs?.flat().filter(Boolean) || [];
  
        // Merge proofs arrays and filter out duplicates based on C value
        const mergedProofs = [...proofsMap, ...eventsProofsArray].reduce((unique: Proof[], proof: Proof) => {
          // Only add if we haven't seen this C value before
          if (!unique.some(p => p.C === proof.C)) {
            unique.push(proof);
          }
          return unique;
        }, []);
  
  
        // let allProofs = proofs.map((proof: any) => {
        //   if(eventsProofs.find((eventProof: any) => eventProof?.C === proof?.C)) {
        //     return proof;
        //   }
        // })
  
        // let allProofsFiltered = allProofs.filter((proof: any) => proof !== undefined);
        // // Create a map to track unique proofs by their C value
        // const uniqueProofs = new Map();
        // allProofsFiltered.forEach((proof: any) => {
        //   // Only add proof if we haven't seen this C value before
        //   if (!uniqueProofs.has(proof.C)) {
        //     uniqueProofs.set(proof.C, proof);
        //   }
        // });
        // // Convert map values back to array
        // allProofsFiltered = Array.from(uniqueProofs.values());
        // storeProofs(allProofsFiltered);
        // console.log("mergedProofs", mergedProofs)

        // storeProofs(mergedProofs);
        const data = await new Promise<ProofState>((res) => {
          wallet.onProofStateUpdates(
            mergedProofs,
            (p) => {
              if (p.state === CheckStateEnum.SPENT) {
                res(p);
                const proofsStr = getProofs();
                // const proofs = JSON.parse(proofsStr);
                let proofsFiltered = proofs.filter((proof: Proof) => proof.C !== p?.proof?.C);

                // TODO create spending event
                // update tokens events
                // update storage proofs
                // console.log("proofsFiltered", proofsFiltered)
                // storeProofs([...proofsFiltered]);
              }
            },
            (e) => {
              console.log(e);
            }
          );
          // wallet.swap(21, proofs);
        });
        // console.log("data proofs websocket", data)
        // const balance = await getUnitBalanceWithProofsChecked(activeUnit, mint, mergedProofs);
        const balance = await getUnitBalance(activeUnit, mint, mergedProofs);
        setCurrentUnitBalance(balance);
        setIsLoading(false);
        setIsBalanceFetching(true);
      } catch (error) {
        console.log("fetchBalanceData error", error)
      } finally {
      }
  
    };
    if (activeUnit && activeMint && !isBalanceFetching) {
      fetchBalanceData();

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUnit, proofs, mints, activeMint, tokensEvents, walletsInfo, wallet, isBalanceFetching]);

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
    </View>
  );
};
