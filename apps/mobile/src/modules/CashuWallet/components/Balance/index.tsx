/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Text} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

import {useStyles} from '../../../../hooks';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  useProofsStorage,
} from '../../../../hooks/useStorageState';
import {useCashuContext} from '../../../../providers/CashuProvider';
import {formatCurrency} from '../../../../utils/helpers';
import stylesheet from './styles';

export const Balance = () => {
  const {getUnitBalance} = useCashuContext()!;

  const styles = useStyles(stylesheet);
  const [alias, setAlias] = useState<string>('');
  const [currentUnitBalance, setCurrentUnitBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const {value: mints} = useMintStorage();
  const {value: activeMint} = useActiveMintStorage();
  const {value: activeUnit, setValue: setActiveUnit} = useActiveUnitStorage();
  const {value: proofs} = useProofsStorage();

  useEffect(() => {
    const mint = mints.filter((mint) => mint.url === activeMint);
    if (mint.length === 1) {
      setAlias(mint[0].alias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMint]);

  const handleCurrencyChange = () => {
    const mintUnits = mints.filter((mint) => mint.url === activeMint)[0].units;
    const currentIndex = mintUnits.indexOf(activeUnit);
    const nextIndex = (currentIndex + 1) % mintUnits.length;
    setActiveUnit(mintUnits[nextIndex]);
  };

  useEffect(() => {
    const fetchBalanceData = async () => {
      setIsLoading(true);
      const mint = mints.filter((mint) => mint.url === activeMint)[0];
      const balance = await getUnitBalance(activeUnit, mint, proofs);
      setCurrentUnitBalance(balance);
      setIsLoading(false);
    };
    if (activeUnit && activeMint && proofs.length > 0) {
      fetchBalanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUnit, proofs, mints]);

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
