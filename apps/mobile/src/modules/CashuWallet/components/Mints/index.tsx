/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import {GetInfoResponse} from '@cashu/cashu-ts';
import {useAuth, useCreateWalletEvent} from 'afk_nostr_sdk';
import {MintData} from 'afk_nostr_sdk/src/hooks/cashu/useCashu';
import {getRandomBytes, randomUUID} from 'expo-crypto';
import React, {useEffect, useState} from 'react';
import {FlatList, Modal, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CloseIcon, InfoIcon, TrashIcon} from '../../../../assets/icons';
import {Button} from '../../../../components';
import {useStyles, useTheme} from '../../../../hooks';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  usePrivKeySignerStorage,
  useProofsStorage,
  useWalletIdStorage,
} from '../../../../hooks/useStorageState';
import {useCashuContext} from '../../../../providers/CashuProvider';
import {formatCurrency} from '../../../../utils/helpers';
import stylesheet from './styles';

export interface UnitInfo {
  unit: string;
  balance: number;
}

export const Mints = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const {getUnitBalance, setActiveMint, setActiveUnit, setMints, buildMintData} =
    useCashuContext()!;
  const {publicKey, privateKey} = useAuth();
  const {value: activeMint, setValue: setActiveMintStorage} = useActiveMintStorage();
  const {value: mints, setValue: setMintsStorage} = useMintStorage();
  const {value: proofs} = useProofsStorage();
  const {setValue: setActiveUnitStorage} = useActiveUnitStorage();
  const {value: privKey, setValue: setPrivKey} = usePrivKeySignerStorage();
  const {value: walletId, setValue: setWalletId} = useWalletIdStorage();

  const [mintUnitsMap, setMintUnitsMap] = useState<Map<string, UnitInfo[]>>(new Map());
  const [mintInfo, setMintInfo] = useState<GetInfoResponse | null>(null);
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newMintError, setNewMintError] = useState<string>('');

  const {mutateAsync: createWalletEvent} = useCreateWalletEvent();

  // Load units and their balances for each mint
  useEffect(() => {
    const loadMintUnits = async () => {
      const newMintUnitsMap = new Map<string, UnitInfo[]>();

      for (const mint of mints) {
        try {
          // Get balance for each unit
          const unitsWithBalance = await Promise.all(
            mint.units.map(async (unit) => {
              const balance = await getUnitBalance(unit, mint, proofs);
              return {
                unit,
                balance,
              };
            }),
          );

          newMintUnitsMap.set(mint.url, unitsWithBalance);
        } catch (error) {
          console.error(`Error loading units for mint ${mint.url}:`, error);
          newMintUnitsMap.set(mint.url, []);
        }
      }

      setMintUnitsMap(newMintUnitsMap);
    };

    loadMintUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mints, proofs]);

  useEffect(() => {
    const isDuplicateAlias = mints.some((mint) => mint.alias === newAlias);
    const isDuplicateUrl = mints.some((mint) => mint.url === newUrl);

    if (isDuplicateAlias) {
      setNewMintError('Error: Duplicate alias');
      return;
    }

    if (isDuplicateUrl) {
      setNewMintError('Error: Duplicate URL');
      return;
    }

    setNewMintError('');
  }, [mints, newAlias, newUrl]);

  const handleSelectMint = (item: MintData) => {
    setActiveMint(item.url);
    setActiveMintStorage(item.url);
    const cUnit = mints.filter((mint) => mint.url === item.url)[0].units[0];
    setActiveUnit(cUnit);
    setActiveUnitStorage(cUnit);
  };

  const handleAddMint = async () => {
    setActiveMint(newUrl);
    setActiveMintStorage(newUrl);
    const data = await buildMintData(newUrl, newAlias);
    setActiveUnit(data.units[0]);
    setActiveUnitStorage(data.units[0]);

    if (mints.length === 0) {
      const privKey = getRandomBytes(32);
      const privateKeyHex = Buffer.from(privKey).toString('hex');
      setPrivKey(privateKeyHex);

      const id = randomUUID();
      setWalletId(id);
    }

    setMints([...mints, data]);
    setMintsStorage([...mints, data]);

    if (privateKey && publicKey) {
      // nostr event
      await createWalletEvent({
        name: walletId,
        mints: mints.map((mint) => mint.url),
        privkey: privKey,
      });
    }

    setNewAlias('');
    setNewUrl('');
  };

  const handleDeleteMint = (item: MintData) => {
    const filteredMints = mints.filter((mint) => mint.url !== item.url);
    setMints([...filteredMints]);
    setMintsStorage([...filteredMints]);

    const defaultMint = mints.filter((mint) => mint.alias === 'Default Mint (minibits)')[0];
    handleSelectMint(defaultMint);
  };

  const renderMintItem = ({item}: {item: MintData}) => {
    const isSelected = activeMint === item.url;
    const unitsInfo = mintUnitsMap.get(item.url) || [];

    return (
      <TouchableOpacity style={styles.mint} onPress={() => handleSelectMint(item)}>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.mintContentContainer}>
          <View style={styles.textsContainer}>
            <Text style={styles.title}>{item.alias}</Text>
            <Text style={styles.title}>{item.url}</Text>
            <View style={styles.unitsContainer}>
              {unitsInfo.map((unitInfo) => (
                <View style={styles.unit} key={unitInfo.unit}>
                  <Text>{formatCurrency(unitInfo.balance, unitInfo.unit)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.mintActionsContainer}>
            <TouchableOpacity onPress={() => setMintInfo(item.info)}>
              <InfoIcon width={20} height={20} color={theme.colors.primary} />
            </TouchableOpacity>
            {item.alias !== 'Default Mint (minibits)' && (
              <TouchableOpacity onPress={() => handleDeleteMint(item)}>
                <TrashIcon width={20} height={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabContentContainer}>
      <View>
        <Text style={styles.tabTitle}>Cashu Mints</Text>
        <FlatList data={mints} renderItem={renderMintItem} keyExtractor={(item) => item.url} />
      </View>
      <View>
        <Text style={[styles.tabTitle, styles.titleMargin]}>Add Cashu Mint</Text>
        <Text style={styles.tabSubtitle}>Enter the URL of a Cashu mint to connect to it.</Text>
        <TextInput
          placeholder="Mint URL"
          value={newUrl}
          onChangeText={setNewUrl}
          style={styles.addMintInput}
        />
        <TextInput
          placeholder="Alias"
          value={newAlias}
          onChangeText={setNewAlias}
          style={styles.addMintInput}
        />
        {newMintError != '' && <Text style={styles.newMintError}>{newMintError}</Text>}
        {newAlias != '' && newUrl != '' && newMintError == '' ? (
          <Button
            style={styles.addMintBtn}
            textStyle={styles.addMintBtnText}
            onPress={handleAddMint}
          >
            Add Mint
          </Button>
        ) : null}
      </View>
      <Modal animationType="fade" transparent={true} visible={mintInfo !== null}>
        <View style={styles.mintInfoModalMainContainer}>
          <View style={styles.mintInfoModalContent}>
            <TouchableOpacity
              onPress={() => setMintInfo(null)}
              style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
            >
              <CloseIcon width={30} height={30} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalTitle]}>
              {mintInfo?.name}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalDescription]}>
              {mintInfo?.description}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalDescription]}>
              {mintInfo?.description_long}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalVersion]}>
              Version: {mintInfo?.version}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalNuts]}>
              Nuts: {Object.keys(mintInfo?.nuts || {}).join(', ')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};
