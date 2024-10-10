import {parseUnits} from '@ethersproject/units';
import {Feather} from '@expo/vector-icons';
import React, {useCallback, useEffect, useState} from 'react';
import {Image, ScrollView, Text, TextInput, TouchableOpacity, View, ViewStyle} from 'react-native';
import {parseEther} from 'viem';
import {useSendTransaction, useWriteContract} from 'wagmi';

import {useSwapModal} from '../../context/SwapModalProvider';
import {useEvmWallet} from '../../context/WalletModalEvmProvider';
import {useStyles, useTheme} from '../../hooks';
import {
  useAvnuExecuteSwap,
  useAvnuSwapCalldata,
  useGetAvnuSwapQuoteDetails,
  useGetEvmTokens,
} from '../../starknet/evm/hooks';
import styleSheet from './styles';
import TokenSelectModal from './TokenSelection';
import {formatToUSD} from './util';
interface Token {
  symbol: string;
  l2_token_address: string;
  decimals: number;
  logo_url: string;
}

export default function TokenSwapView({showHeader = false}: {showHeader?: boolean}) {
  const {showSwap} = useSwapModal();
  const {sendTransaction} = useSendTransaction();
  const {showEvmWallet, address, isConnected} = useEvmWallet();
  const {data: hash} = useWriteContract();

  const {data: tokens} = useGetEvmTokens();
  const [toToken, setToToken] = useState<Token | null>(null);
  const [toAmount, setToAmount] = useState<string>('0');
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('0');

  const [modalVisible, setModalVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');
  const [shouldRefetchQuote, setShouldRefetchQuote] = useState(false);

  // Determine which amount and token to use based on activeInput and reversed state
  const amount = activeInput === 'to' ? toAmount : fromAmount;

  const token = activeInput === 'to' ? toToken : fromToken;
  const otherToken = activeInput === 'to' ? fromToken : toToken;

  //USD VALUES
  const [estUsdValue, setEstUSDValue] = useState<string | any>('$0.00');

  //AVNU SWAP DETAILS
  const {data: avnuSwapDetails} = useGetAvnuSwapQuoteDetails({
    buyTokenAddress: otherToken?.l2_token_address as any,
    sellAmount: amount !== '0' ? parseUnits(amount || '0', fromToken?.decimals)._hex : '',
    sellTokenAddress: token?.l2_token_address as any,
    size: 3,
  });
  const {mutate: mutateSwapCallData} = useAvnuSwapCalldata();

  const {mutate: mutateExecuteSwap} = useAvnuExecuteSwap();

  const theme = useTheme();
  const styles = useStyles(styleSheet);

  const updateAmounts = useCallback((newFromAmount: string, newToAmount: string) => {
    setFromAmount(newFromAmount);
    setToAmount(newToAmount);

    setShouldRefetchQuote(true);
  }, []);

  useEffect(() => {
    if (activeInput === 'from' && fromAmount === '') {
      setEstUSDValue('$0.00');
    }
    if (activeInput === 'to' && toAmount === '') {
      setEstUSDValue('$0.00');
    }
    function updateUSDValues() {
      if (activeInput === 'from' && fromAmount !== '' && fromToken && avnuSwapDetails?.length) {
        setEstUSDValue(formatToUSD(avnuSwapDetails[0].sellAmountInUsd));
      } else if (activeInput === 'to' && toAmount !== '' && toToken && avnuSwapDetails?.length) {
        setEstUSDValue(formatToUSD(avnuSwapDetails[0].buyAmountInUsd));
      }
    }
    updateUSDValues();
  }, [
    fromToken,
    fromAmount,
    toToken,
    toAmount,
    activeInput,
    avnuSwapDetails?.length,
    avnuSwapDetails,
  ]);

  useEffect(() => {
    if (tokens && tokens.length >= 5) {
      setFromToken(tokens[4]);
      setToToken(tokens[1]);
    }
  }, [tokens]);

  useEffect(() => {
    if (avnuSwapDetails) {
      if (activeInput === 'from' && fromAmount !== '' && avnuSwapDetails?.length) {
        setToAmount(formatToUSD(avnuSwapDetails[0].buyAmountInUsd));
      } else if (activeInput === 'to' && toAmount !== '' && avnuSwapDetails?.length) {
        setFromAmount(formatToUSD(avnuSwapDetails[0].sellAmountInUsd));
      }
      setShouldRefetchQuote(false);
    }
  }, [activeInput, fromAmount, toAmount, shouldRefetchQuote, avnuSwapDetails]);

  const handleFromAmountChange = (value: string) => {
    updateAmounts(value, '');
    setActiveInput('from');
  };

  //: Disabled this for now
  const handleToAmountChange = (value: string) => {
    updateAmounts('', value);
    setActiveInput('to');
  };
  //: Disabled this for now
  const handleReverseSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    updateAmounts(toAmount, fromAmount);
    setActiveInput(activeInput === 'from' ? 'to' : 'from');
    setShouldRefetchQuote(true);
  };

  const openModal = (input: 'from' | 'to') => {
    setActiveInput(input);
    setModalVisible(true);
  };

  const selectToken = (token: Token) => {
    if (activeInput === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setModalVisible(false);
    updateAmounts(fromAmount, toAmount);
  };

  const handleCallData = () => {
    if (toAmount === '0' && fromAmount === '0') return;
    mutateSwapCallData(
      {
        takerAddress: address as string,
        slippage: 0.5,
        quoteId: avnuSwapDetails?.length ? avnuSwapDetails[0].quoteId : '',
        includeApprove: true,
      },
      {
        async onSuccess(data) {
          // Find the swap call
          const swapCall = data.calls.find(
            (call) => call.entrypoint === 'swap' || call.entrypoint === 'multi_route_swap',
          );

          if (swapCall) {
            sendTransaction(
              {
                to: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
                value: parseEther('0.000001'),
              },
              {
                onSuccess() {
                  console.log('Swap transaction sent:', hash);
                  // Execute the swap on Avnu backend
                  mutateExecuteSwap({
                    quoteId: avnuSwapDetails?.length ? avnuSwapDetails[0].quoteId : '',
                    signature: [''], // You can use this if needed in your backend
                  });
                },
              },
            );
          }
        },
        onError(error) {
          console.error('Failed to get swap call data:', error);
        },
      },
    );
  };
  const handleExecute = () => {
    mutateExecuteSwap({
      quoteId: avnuSwapDetails?.length ? avnuSwapDetails[0].quoteId : '',
      signature: [''],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showHeader && (
        <View
          style={{
            paddingBottom: 16,
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
          <Text style={{textAlign: 'left', fontSize: 24, color: theme.theme.colors.swap_text}}>
            Swap Token
          </Text>
        </View>
      )}
      <View style={styles.swapCard}>
        {/* From Token Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label_dim}>From</Text>
          </View>
          <View style={styles.inputRow}>
            <NumberInput
              style={styles.input}
              placeholder="0.0"
              value={fromAmount}
              onChangeText={handleFromAmountChange}
            />

            <TouchableOpacity style={styles.tokenSelect} onPress={() => openModal('from')}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{uri: fromToken?.logo_url}}
                  style={{
                    width: 22,
                    height: 22,
                  }}
                />
                <Text style={styles.tokenSelectText}>{fromToken?.symbol}</Text>
              </View>
              <Feather name="chevron-down" size={20} color={theme.theme.colors.swap_text} />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceEstimate}>
            <Text style={styles.estimate}>≈ {estUsdValue}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.reverseButton}>
          <Feather name="arrow-down" size={20} color={theme.theme.colors.swap_primary} />
        </TouchableOpacity>

        {/* To Token Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label_dim}>To</Text>
          </View>
          <View style={styles.inputRow}>
            <NumberInput
              style={styles.input}
              placeholder="0.0"
              value={toAmount}
              onChangeText={() => console.log()}
              disabled
            />

            <TouchableOpacity style={styles.tokenSelect} onPress={() => openModal('to')}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{uri: toToken?.logo_url}}
                  style={{
                    width: 22,
                    height: 22,
                  }}
                />
                <Text style={styles.tokenSelectText}>{toToken?.symbol}</Text>
              </View>
              <Feather name="chevron-down" size={20} color={theme.theme.colors.swap_text} />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceEstimate}>
            <Text style={styles.estimate}>≈ {estUsdValue}</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>{/* Add swap info and other details if needed */}</View>

        {isConnected ? (
          <TouchableOpacity onPress={() => handleCallData()} style={styles.swapButton}>
            <Text style={styles.swapButtonText}>Swap</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => showEvmWallet()} style={styles.swapButton}>
            <Text style={styles.swapButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        )}
      </View>

      <TokenSelectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={selectToken}
      />
    </ScrollView>
  );
}

interface NumberInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  placeholder,
  value,
  onChangeText,
  style,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState<string>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    if (disabled) return;
    const sanitizedText = text.replace(/[^0-9.]/g, '');
    const parts = sanitizedText.split('.');
    const formattedText = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 18) : '');
    if (formattedText === '00' || formattedText.startsWith('00.') || formattedText === '.') {
      return;
    }
    setLocalValue(formattedText);

    onChangeText(formattedText);
  };

  return (
    <TextInput
      style={style}
      placeholder={placeholder}
      value={localValue}
      onChangeText={handleChangeText}
      keyboardType="decimal-pad"
    />
  );
};
