import {useEffect, useState} from 'react';
import {StyleProp, TextInput, TextStyle, View, ViewStyle} from 'react-native';

import {CHAIN_ID} from '../../constants/env';
import {MultiChainToken, MultiChainTokens, TokenSymbol} from '../../constants/tokens';
import {useStyles, useTheme} from '../../hooks';
import {Button} from '../Button';
import {Picker} from '../Picker';
import stylesheet from './styles';

export type SwapProps = {
  /**
   * Error message to be displayed.
   * If this prop is not provided or is undefined, no error message will be displayed.
   */
  tokensIns: MultiChainTokens;
  tokenOut: MultiChainToken;
  onPress: () => void;
  calculRewardCallback: () => void;
  error?: string;

  left?: React.ReactNode;
  right?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export const Swap: React.FC<SwapProps> = (props) => {
  const {
    tokensIns,
    tokenOut,
    onPress,
    calculRewardCallback,
    error,
    left,
    right,
    style: styleProp,
    containerStyle: containerStyleProp,
    inputStyle: inputStyleProp,
    ...SwapProps
  } = props;

  const {theme} = useTheme();
  const styles = useStyles(stylesheet, !!error, !!left, !!right);
  const [token, setToken] = useState<TokenSymbol>(TokenSymbol.ETH);

  const [amount, setAmount] = useState('');
  const handleChangeAmount = (value: string) => {
    setAmount(value);
  };

  useEffect(() => {
    // Should consider using debounce
    if (calculRewardCallback) calculRewardCallback();
  }, [amount, calculRewardCallback]);

  return (
    <View style={[styles.container, containerStyleProp]}>
      <View style={[styles.content, styleProp]}>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={handleChangeAmount}
          placeholder="Enter amount"
          style={[styles.input, inputStyleProp]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          underlineColorAndroid="transparent"
          {...SwapProps}
        />

        <Picker
          label="Please select a token"
          selectedValue={token}
          onValueChange={(itemValue) => setToken(itemValue as TokenSymbol)}
        >
          {Object.values(tokensIns).map((tkn) => (
            <Picker.Item
              key={tkn[CHAIN_ID].symbol}
              label={tkn[CHAIN_ID].name}
              value={tkn[CHAIN_ID].symbol}
            />
          ))}
        </Picker>
      </View>
      <View style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <View>Amount received in {tokenOut[CHAIN_ID].symbol}:</View>
        <View style={[styles.input, inputStyleProp]}>0</View>
        <Button onPress={onPress}>Swap</Button>
      </View>
    </View>
  );
};
