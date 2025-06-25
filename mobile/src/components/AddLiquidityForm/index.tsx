import { View, ActivityIndicator } from 'react-native';
import { useAccount } from '@starknet-react/core';
import { Formik } from 'formik';
import { Button, SquareInput, Text } from '../../components';
import { useStyles } from '../../hooks';
import { useToast, useWalletModal } from '../../hooks/modals';

import { AddLiquidityValidationSchema } from './validation';
import stylesheet from './styles';
import { useState } from 'react';
import { useAddLiquidity } from '../../hooks/launchpad/useAddLiquidity';
import { numericValue } from '../../utils/format';

type FormValues = {
  amount: string;
  dexType: 'EKUBO' | 'JEDISWAP' | 'UNRUGGABLE';
  startingPrice?: string;
  liquidityLockTime?: string;
  ekuboPrice?: string;
  minLiquidity?: string;
  teamAllocation?: string;
  hodlLimit?: string;
  liquidityType?: 'EKUBO_NFT' | 'JEDISWAP_LP';
  unlockTime?: string;
  teamVestingPeriod?: string;
  teamVestingCliff?: string;
};

export const AddLiquidityForm: React.FC<{
  tokenAddress: string;
}> = ({ tokenAddress }) => {
  const styles = useStyles((theme) => stylesheet);
  const account = useAccount();
  const { showToast } = useToast();
  const walletModal = useWalletModal();
  const { addLiquidityUnrug, addLiquidityEkubo, addLiquidityJediswap } = useAddLiquidity();
  const [isLoading, setIsLoading] = useState(false);

  const initialValues: FormValues = {
    amount: '',
    dexType: 'UNRUGGABLE',
    startingPrice: '',
    liquidityLockTime: '',
    ekuboPrice: '',
    minLiquidity: '',
    teamAllocation: '0',
    hodlLimit: '0',
    liquidityType: 'EKUBO_NFT',
    unlockTime: '',
    teamVestingPeriod: '0',
    teamVestingCliff: '0',
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      if (!account.address) {
        walletModal.show();
        return;
      }

      if (!account.account) {
        showToast({ type: 'error', title: 'Account not connected' });
        return;
      }

      switch (values.dexType) {
        case 'UNRUGGABLE':
          await addLiquidityUnrug(
            account.account,
            tokenAddress,
            values.amount,
            values.startingPrice!,
            values.liquidityLockTime!,
          );
          break;
        case 'EKUBO':
          await addLiquidityEkubo(account.account, tokenAddress, values.amount, values.ekuboPrice!);
          break;
        case 'JEDISWAP':
          await addLiquidityJediswap(
            account.account,
            tokenAddress,
            values.amount,
            values.minLiquidity!,
          );
          break;
      }

      showToast({ type: 'success', title: 'Liquidity added successfully' });
    } catch (error) {
      console.error('Add liquidity error:', error);
      showToast({
        type: 'error',
        title: 'Failed to add liquidity',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDexFields = (
    values: FormValues,
    handleChange: any,
    handleBlur: any,
    errors: any,
    touched: any,
    setFieldValue: any
  ) => {
    switch (values.dexType) {
      case 'UNRUGGABLE':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Starting Price</Text>
              <SquareInput
                placeholder="Enter starting price"
                onChangeText={(text) => {
                  setFieldValue('startingPrice', numericValue(text));
                }}
                onBlur={handleBlur('startingPrice')}
                value={values.startingPrice}
                keyboardType="decimal-pad"
              />
              {touched.startingPrice && errors.startingPrice && (
                <Text style={styles.error}>{errors.startingPrice}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Team Allocation (%)</Text>
              <SquareInput
                placeholder="Enter team allocation percentage"
                onChangeText={(text) => {
                  setFieldValue('teamAllocation', numericValue(text));
                }}
                onBlur={handleBlur('teamAllocation')}
                value={values.teamAllocation}
                keyboardType="decimal-pad"
              />
              {touched.teamAllocation && errors.teamAllocation && (
                <Text style={styles.error}>{errors.teamAllocation}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Team Vesting Period (days)</Text>
              <SquareInput
                placeholder="Enter vesting period"
                onChangeText={(text) => {
                  setFieldValue('teamVestingPeriod', numericValue(text));
                }}
                onBlur={handleBlur('teamVestingPeriod')}
                value={values.teamVestingPeriod}
                keyboardType="number-pad"
              />
              {touched.teamVestingPeriod && errors.teamVestingPeriod && (
                <Text style={styles.error}>{errors.teamVestingPeriod}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hodl Limit</Text>
              <SquareInput
                placeholder="Enter hodl limit"
                onChangeText={(text) => {
                  setFieldValue('hodlLimit', numericValue(text));
                }}
                onBlur={handleBlur('hodlLimit')}
                value={values.hodlLimit}
                keyboardType="decimal-pad"
              />
              {touched.hodlLimit && errors.hodlLimit && (
                <Text style={styles.error}>{errors.hodlLimit}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lock Time (days)</Text>
              <SquareInput
                placeholder="Enter lock time in days"
                onChangeText={(text) => {
                  setFieldValue('liquidityLockTime', numericValue(text));
                }}
                onBlur={handleBlur('liquidityLockTime')}
                value={values.liquidityLockTime}
                keyboardType="number-pad"
              />
              {touched.liquidityLockTime && errors.liquidityLockTime && (
                <Text style={styles.error}>{errors.liquidityLockTime}</Text>
              )}
            </View>
          </>
        );

      case 'EKUBO':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Price</Text>
              <SquareInput
                placeholder="Enter price"
                onChangeText={(text) => {
                  setFieldValue('ekuboPrice', numericValue(text));
                }}
                onBlur={handleBlur('ekuboPrice')}
                value={values.ekuboPrice}
                keyboardType="decimal-pad"
              />
              {touched.ekuboPrice && errors.ekuboPrice && (
                <Text style={styles.error}>{errors.ekuboPrice}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Liquidity Type</Text>
              <SquareInput
                placeholder="EKUBO_NFT"
                onChangeText={handleChange('liquidityType')}
                onBlur={handleBlur('liquidityType')}
                value={values.liquidityType}
              />
              {touched.liquidityType && errors.liquidityType && (
                <Text style={styles.error}>{errors.liquidityType}</Text>
              )}
            </View>
          </>
        );

      case 'JEDISWAP':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Minimum Liquidity</Text>
              <SquareInput
                placeholder="Enter minimum liquidity"
                onChangeText={(text) => {
                  setFieldValue('minLiquidity', numericValue(text));
                }}

                onBlur={handleBlur('minLiquidity')}
                value={values.minLiquidity}
                keyboardType="decimal-pad"
              />
              {touched.minLiquidity && errors.minLiquidity && (
                <Text style={styles.error}>{errors.minLiquidity}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Liquidity Type</Text>
              <SquareInput
                placeholder="JEDISWAP_LP"
                onChangeText={handleChange('liquidityType')}
                onBlur={handleBlur('liquidityType')}
                value={values.liquidityType}
              />
              {touched.liquidityType && errors.liquidityType && (
                <Text style={styles.error}>{errors.liquidityType}</Text>
              )}
            </View>
          </>
        );
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={AddLiquidityValidationSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <View style={styles.container}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          )}

          <View style={styles.dexSelector}>
            {['UNRUGGABLE', 'EKUBO', 'JEDISWAP'].map((dex) => (
              <Button
                key={dex}
                style={[styles.dexButton, values.dexType === dex && styles.dexButtonActive]}
                onPress={() => handleChange('dexType')(dex)}
              >
                <Text
                  style={[
                    styles.dexButtonText,
                    values.dexType === dex && styles.dexButtonTextActive,
                  ]}
                >
                  {dex}
                </Text>
              </Button>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <SquareInput
              placeholder="Enter amount"
              onChangeText={(text) => {
                setFieldValue('amount', numericValue(text));
              }}
              onBlur={handleBlur('amount')}
              value={values.amount}
              keyboardType="decimal-pad"
            />
            {touched.amount && errors.amount && <Text style={styles.error}>{errors.amount}</Text>}
          </View>

          {renderDexFields(values, handleChange, handleBlur, errors, touched, setFieldValue)}

          <Button onPress={() => handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
          </Button>
        </View>
      )}
    </Formik>
  );
};
