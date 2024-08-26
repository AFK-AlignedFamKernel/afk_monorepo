import {useState} from 'react';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {Button} from '../Button';
import {Input} from '../Input';
import {Text} from '../Text';
import stylesheet from './styles';

export type LaunchActionsFormProps = {
  onBuyPress: () => void;
  onSellPress: () => void;
  onChangeText: (e: any) => void;
};

enum AmountType {
  QUOTE_AMOUNT,
  COIN_AMOUNT_TO_BUY,
}
export const LaunchActionsForm: React.FC<LaunchActionsFormProps> = ({
  onBuyPress,
  onSellPress,
  onChangeText,
}) => {
  const styles = useStyles(stylesheet);

  const [isActive, setIsActive] = useState(false);

  const [typeAmount, setTypeAmount] = useState<AmountType>(AmountType.QUOTE_AMOUNT);

  return (
    <View style={styles.container}>
      <Input
        keyboardType="numeric"
        // value={amount ? String(amount) : "0"}
        style={{borderColor: isActive ? '#A1A1C7' : '#000', marginTop: 15}}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        onChangeText={onChangeText}
        placeholder="Amount"
      />
      <View
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          gap: 3,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Button onPress={onBuyPress} style={{backgroundColor: 'green', width: 'auto', flexGrow: 1}}>
          <Text>Buy</Text>
        </Button>

        <Button onPress={onSellPress} style={{backgroundColor: 'red', width: 'auto', flexGrow: 1}}>
          Sell
        </Button>
      </View>
    </View>
  );
};
