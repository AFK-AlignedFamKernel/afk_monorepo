import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useAccount} from '@starknet-react/core';
import {useQueryClient} from '@tanstack/react-query';
import {useProfile} from 'afk_nostr_sdk';
// import { useAuth } from '../../store/auth';
import {useAuth} from 'afk_nostr_sdk';
import {Formik, FormikProps} from 'formik';
import {useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';

import {Button, SquareInput, Text} from '../../components';
import {useStyles, useWaitConnection} from '../../hooks';
import {DeployTokenFormValues, useCreateToken} from '../../hooks/launchpad/useCreateToken';
import {useToast, useWalletModal} from '../../hooks/modals';
import stylesheet from '../../screens/CreateChannel/styles';
import {TipSuccessModalProps} from '../TipSuccessModal';

const UsernameInputLeft = (
  <Text weight="bold" color="inputPlaceholder">
    @
  </Text>
);

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
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const walletModal = useWalletModal();
  const styles = useStyles(stylesheet);
  const publicKey = useAuth((state) => state.publicKey);
  const profile = useProfile({publicKey});
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const account = useAccount();
  const waitConnection = useWaitConnection();
  const {deployToken, deployTokenAndLaunch} = useCreateToken();

  const [type, setType] = useState(TypeCreate.CREATE);
  const initialFormValues: FormValues = {
    name: 'My Man',
    symbol: 'MY_MAN',
    // ticker: '',
    initialSupply: 100_000_000,
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

      const data: DeployTokenFormValues = {
        recipient: account?.address,
        name: values.name,
        symbol: values.symbol,
        initialSupply: values?.initialSupply,
        contract_address_salt: values.contract_address_salt,
        is_unruggable:values.is_unruggable
      };
      if (!account || !account?.account) return;
      console.log('test deploy');

      let tx;
      if (type == TypeCreate.CREATE) {
        tx = await deployToken(account?.account, data);
      } else {
        tx = await deployTokenAndLaunch(account?.account, data);
      }

      if (tx) {
        showToast({type: 'success', title: 'Token launch created successfully'});
      }
    } catch (error) {
      showToast({type: 'error', title: 'Failed to create token and launch'});
    }
  };

  if (profile.isLoading) return null;

  return (
    <ScrollView automaticallyAdjustKeyboardInsets style={styles.container}>
      <Text>Launch your Token</Text>

      <Formik
        innerRef={formikRef}
        initialValues={initialFormValues}
        onSubmit={onFormSubmit}
        validate={validateForm}
      >
        {({handleChange, handleBlur, values, errors}) => (
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

            <Button onPress={() => onSubmitPress(TypeCreate.CREATE)}>Create coin</Button>

            <Button onPress={() => onSubmitPress(TypeCreate.CREATE_AND_LAUNCH)}>
              Create & Launch coin
            </Button>

            <View style={styles.gap} />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};
