import {View} from 'react-native';
import {useAccount} from '@starknet-react/core';
import {Formik} from 'formik';
import {Button, SquareInput, Text} from '../../components';
import {useStyles} from '../../hooks';
import {useToast, useWalletModal} from '../../hooks/modals';
import stylesheet from './styles';

type FormValues = {
  amount: string;
  dexType: 'EKUBO' | 'JEDISWAP' | 'UNRUGGABLE';
  // Add Unruggable specific params
  startingPrice?: string;
  liquidityLockTime?: string;
};

export const AddLiquidityForm: React.FC<{
  tokenAddress: string;
}> = ({tokenAddress}) => {
  const styles = useStyles(() => stylesheet);
  const account = useAccount();
  const {showToast} = useToast();
  const walletModal = useWalletModal();

  const initialValues: FormValues = {
    amount: '',
    dexType: 'UNRUGGABLE',
    startingPrice: '',
    liquidityLockTime: ''
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!account.address) {
        walletModal.show();
        return;
      }

      // TODO: Add liquidity logic based on dexType
      showToast({type: 'success', title: 'Liquidity added successfully'});
    } catch (error) {
      showToast({type: 'error', title: 'Failed to add liquidity'});
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({handleChange, handleBlur, handleSubmit, values}) => (
        <View>
          <Text>Add Liquidity</Text>
          
          <SquareInput
            placeholder="Amount"
            onChangeText={handleChange('amount')}
            onBlur={handleBlur('amount')}
            value={values.amount}
          />

          <SquareInput
            placeholder="Starting Price"
            onChangeText={handleChange('startingPrice')}
            onBlur={handleBlur('startingPrice')} 
            value={values.startingPrice}
          />

          <SquareInput
            placeholder="Lock Time (days)"
            onChangeText={handleChange('liquidityLockTime')}
            onBlur={handleBlur('liquidityLockTime')}
            value={values.liquidityLockTime}
          />

          <Button onPress={() => handleSubmit()}>
            Add Liquidity
          </Button>
        </View>
      )}
    </Formik>
  );
};
