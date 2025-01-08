import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useAccount } from '@starknet-react/core';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from 'afk_nostr_sdk';
// import { useAuth } from '../../store/auth';
import { useAuth } from 'afk_nostr_sdk';
import { Formik, FormikProps } from 'formik';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Button, SquareInput, Text } from '../../components';
import { useStyles, useWaitConnection, useWindowDimensions } from '../../hooks';
import { DeployTokenFormValues, useCreateToken } from '../../hooks/launchpad/useCreateToken';
import { useToast, useWalletModal } from '../../hooks/modals';
import stylesheet from '../../screens/CreateChannel/styles';
import { TipSuccessModalProps } from '../TipSuccessModal';
import { Picker } from '@react-native-picker/picker';
import { BondingType } from '../../types/keys';
import { numericValue } from '../../utils/format';
import { useTokenCreatedModal } from '../../hooks/modals/useTokenCreateModal';
import { LoadingSpinner } from '../../components/Loading';

enum TypeCreate {
  LAUNCH,
  CREATE,
  CREATE_AND_LAUNCH,
}
export type FormTokenCreatedProps = {
  event?: NDKEvent;
  starknetAddress?: string;
  hide?: () => void;
  showSuccess?: (props: TipSuccessModalProps) => void;
  hideSuccess?: () => void;
};

type FormValues = DeployTokenFormValues;
export const FormLaunchToken: React.FC<FormTokenCreatedProps> = () => {
  const [loading, setLoading] = useState(false)
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const { hide: hideTokenCreateModal } = useTokenCreatedModal();
  const walletModal = useWalletModal();
  const styles = useStyles(stylesheet);
  const publicKey = useAuth((state) => state.publicKey);
  const profile = useProfile({ publicKey });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const account = useAccount();
  const waitConnection = useWaitConnection();
  const { deployToken, deployTokenAndLaunch } = useCreateToken();

  const [type, setType] = useState(TypeCreate.CREATE);
  const initialFormValues: FormValues = {
    name: '',
    symbol: '',
    bonding_type: BondingType.Linear,
    // ticker: '',
    initialSupply: undefined,
    contract_address_salt: undefined,
    recipient: account?.address,
  };

  const onSubmitPress = (type: TypeCreate) => {
    setType(type);
    formikRef.current?.handleSubmit();
  };

  const validateForm = (values: FormValues) => {
    const errors = {} as Partial<FormValues>;
    // TODO: Do validation

    return errors;
  };

  const onFormSubmit = async (values: FormValues) => {
    try {
      console.log('onFormSubmit deploy');
      if (!account.address) {
        walletModal.show();
        const result = await waitConnection();
        if (!result) return;
      }

      if (!account || !account?.account) return;
      console.log('test deploy');

      if (!values?.symbol) {
        return showToast({ type: 'info', title: 'Add symbol' });
      } else if (!values?.name) {
        return showToast({ type: 'info', title: 'Add name' });
      }
      else if (!values?.initialSupply) {
        return showToast({ type: 'info', title: 'Initial supply required' });
      }

      let tx;
      setLoading(true)
      if (type == TypeCreate.CREATE) {
        const data: DeployTokenFormValues = {
          recipient: account?.address,
          name: values.name,
          symbol: values.symbol,
          initialSupply: values?.initialSupply,
          contract_address_salt: values.contract_address_salt,
          is_unruggable: values.is_unruggable,
        };

        tx = await deployToken(account?.account, data).catch(err => {
          showToast({ type: 'error', title: err?.message || "Something went wrong" });
          setLoading(false)
        });


      } else {
        const data: DeployTokenFormValues = {
          recipient: account?.address,
          name: values.name,
          symbol: values.symbol,
          initialSupply: values?.initialSupply,
          contract_address_salt: values.contract_address_salt,
          is_unruggable: values.is_unruggable,
          bonding_type: values.bonding_type,
        };
        tx = await deployTokenAndLaunch(account?.account, data).catch(err => {
          // showToast({ type: 'error', title: err?.message || "Something went wrong" });
          showToast({ type: 'error', title: "Something went wrong", description: err?.message || "Something went wrong" });

          setLoading(false)
        });
      }

      if (tx) {
        showToast({ type: 'success', title: 'Token launch created successfully' });
        hideTokenCreateModal?.()
        setLoading(false)
      }
    } catch (error) {

      showToast({ type: 'error', title: 'Failed to create token and launch' });
      setLoading(false)
    }

  };

  if (profile.isLoading) return null;

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      style={styles.container}
      contentContainerStyle={
        isDesktop ? styles.contentContainerDesktop : styles.contentContainerMobile
      }
    >
      <Formik
        innerRef={formikRef}
        initialValues={initialFormValues}
        onSubmit={onFormSubmit}
        validate={validateForm}
      >
        {({ handleChange, handleBlur, values, errors, setFieldValue }) => (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                placeholder="AFK Token"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Symbol</Text>
              <TextInput
                value={values.symbol}
                onChangeText={handleChange('symbol')}
                onBlur={handleBlur('symbol')}
                placeholder="AFK"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Total Supply</Text>
              <TextInput
                // type="number"
                value={values.initialSupply?.toString()}
                onChangeText={(text) => setFieldValue("initialSupply", numericValue(text))}
                onBlur={handleBlur('initialSupply')}
                placeholder="100000"
                inputMode="numeric"
                keyboardType="numeric"
                style={styles.input}


              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bonding Type</Text>
              <Picker
                selectedValue={values.bonding_type}
                onValueChange={(itemValue) => {
                  formikRef.current?.setFieldValue('bonding_type', Number(itemValue));
                }}
                style={styles.input}
              >
                {Object.keys(BondingType)
                  .filter((key) => isNaN(Number(key)))
                  .map((bonding) => (
                    <Picker.Item
                      key={bonding}
                      label={bonding}
                      value={BondingType[bonding as keyof typeof BondingType]}
                    />
                  ))}
              </Picker>
            </View>

            <Button disabled={loading} variant="primary" onPress={() => onSubmitPress(TypeCreate.CREATE)}>
              Create
              {loading && type == TypeCreate.CREATE &&
                <LoadingSpinner size={14} />
              }
            </Button>

            <Button disabled={loading} variant="primary" onPress={() => onSubmitPress(TypeCreate.CREATE_AND_LAUNCH)}>
              Create & Launch
              {loading && type !== TypeCreate.CREATE &&
                <LoadingSpinner size={14} />
              }
            </Button>

            <View style={styles.gap} />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};
