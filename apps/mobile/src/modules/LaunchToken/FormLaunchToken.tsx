import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Formik, FormikProps } from 'formik';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, SquareInput, Text } from '../../components';
import { useProfile, useStyles, useWaitConnection } from '../../hooks';
import { useToast, useWalletModal } from '../../hooks/modals';
import stylesheet from '../../screens/CreateChannel/styles';
import { useAuth } from '../../store/auth';
import { MainStackNavigationProps } from '../../types';
import { DeployTokenFormValues, useDeployTokenUnruggable } from '../../hooks/unruggable/useDeploy';
import { useAccount } from '@starknet-react/core';

const UsernameInputLeft = (
  <Text weight="bold" color="inputPlaceholder">
    @
  </Text>
);

type FormValues = DeployTokenFormValues;
export const FormLaunchToken: React.FC = () => {
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const styles = useStyles(stylesheet);
  const publicKey = useAuth((state) => state.publicKey);
  const profile = useProfile({ publicKey });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigation = useNavigation<MainStackNavigationProps>();
  const account = useAccount()
  const waitConnection = useWaitConnection()
  const { deployTokenUnruggable } = useDeployTokenUnruggable()
  if (profile.isLoading) return null;
  const initialFormValues: FormValues = {
    name: 'My Man is AFK or !AFK',
    symbol: 'MMNAFK',
    // ticker: '',
    initialSupply: 100,
    contract_address_salt: ""
  };

  const onSubmitPress = () => {
    formikRef.current?.handleSubmit();
  };

  const validateForm = (values: FormValues) => {
    const errors = {} as Partial<FormValues>;

    // TODO: Do validation

    return errors;
  };

  const onFormSubmit = async (values: FormValues) => {
    try {
      console.log("onFormSubmit deploy")
      if (!account.address) {
        walletModal.show();
        const result = await waitConnection();
        if (!result) return;
      }

      const data: DeployTokenFormValues = {
        name: values.name,
        symbol: values.symbol,
        initialSupply: values?.initialSupply,
        contract_address_salt: values.contract_address_salt
      };
      if (!account || !account?.account) return;
      deployTokenUnruggable(account?.account, data);
      showToast({ type: 'success', title: 'Token launch created successfully' });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to create token and launch' });
    }
  };

  const walletModal = useWalletModal();


  return (
    <ScrollView automaticallyAdjustKeyboardInsets style={styles.container}>
      <Text>Launch your Unruggable Token</Text>

      <Formik
        innerRef={formikRef}
        initialValues={initialFormValues}
        onSubmit={onFormSubmit}
        validate={validateForm}
      >

        {({ handleChange, handleBlur, values, errors }) => (
          <View style={styles.form}>
            <SquareInput
              placeholder="Token name"
              left={UsernameInputLeft}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              value={values.name}
              error={errors.name}
            />

            <SquareInput
              placeholder="Symbol: AFK"
              onChangeText={handleChange('symbol')}
              onBlur={handleBlur('symbol')}
              value={values.symbol}
              error={errors.symbol}
            />

            <SquareInput
              placeholder="Total supply: 100000"
              onChangeText={handleChange('initialSupply')}
              onBlur={handleBlur('initialSupply')}
              value={values.initialSupply?.toString()}
              error={errors.initialSupply?.toString()}
            />

            <Button
              onPress={onSubmitPress}
            // onPress={() => onSubmitPress}
            >Launch coming soon</Button>

            <View style={styles.gap} />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};
