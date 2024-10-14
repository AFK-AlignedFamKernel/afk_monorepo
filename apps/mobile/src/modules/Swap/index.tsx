import {Feather} from '@expo/vector-icons';
import {useAccount} from '@starknet-react/core';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Image, ScrollView, Text, TextInput, TouchableOpacity, View, ViewStyle} from 'react-native';

import {WalletModalContext} from '../../context/WalletModal';
import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {
  useAvnuExecuteSwap,
  useAvnuSwapBuildDataType,
  useAvnuSwapCalldata,
  useGetAvnuSwapQuoteDetails,
  useGetEvmTokens,
} from '../../starknet/evm/hooks';
import styleSheet from './styles';
import TokenSelectModal from './TokenSelection';
import {formatToUSD, parseAmountToHex, parseUSD} from './util';
interface Token {
  symbol: string;
  l2_token_address: string;
  decimals: number;
  logo_url: string;
}

export default function TokenSwapView({showHeader = false}: {showHeader?: boolean}) {
  const {showToast} = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const walletModalContext = useContext(WalletModalContext);

  const {address, isConnected, account} = useAccount();

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

  //Parse Amount
  const sellAmount = parseUSD(amount);

  //AVNU SWAP DETAILS
  const {data: avnuSwapDetails, refetch} = useGetAvnuSwapQuoteDetails({
    buyTokenAddress: otherToken?.l2_token_address as any,
    sellAmount: amount !== '0' ? parseAmountToHex(sellAmount, fromToken?.decimals as any) : '',
    sellTokenAddress: token?.l2_token_address as any,
    size: 3,
  });
  const {mutate: mutateSwapCallData} = useAvnuSwapCalldata();

  const {mutate: mutateExecuteSwap} = useAvnuExecuteSwap();
  const {mutate: mutateSwapBuildDataType} = useAvnuSwapBuildDataType();

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
    updateAmounts('0', '0');
    setEstUSDValue('$0.00');
  };

  const handleExecute = async () => {
    if (toAmount === '0' && fromAmount === '0') return;
    setIsLoading(true);

    // Refetch the quote to ensure we have the latest data
    const freshQuote = await refetch();

    mutateSwapCallData(
      {
        takerAddress: account?.address as string,
        slippage: 0.05,
        quoteId: freshQuote?.data?.length ? freshQuote.data[0].quoteId : '',
        includeApprove: true,
      },
      {
        async onSuccess(data) {
          // Find the approve call and the swap call
          const approveCall = data.calls.find((call) => call.entrypoint === 'approve');
          const swapCall = data.calls.find(
            (call) => call.entrypoint === 'swap' || call.entrypoint === 'multi_route_swap',
          );

          if (approveCall && swapCall) {
            try {
              // Execute both calls in a single transaction
              const res = await account?.execute([
                {
                  contractAddress: approveCall.contractAddress,
                  entrypoint: approveCall.entrypoint,
                  calldata: approveCall.calldata,
                },
                {
                  contractAddress: swapCall.contractAddress,
                  entrypoint: swapCall.entrypoint,
                  calldata: swapCall.calldata,
                },
              ]);
              if (res?.transaction_hash) {
                setIsLoading(false);
                showToast({type: 'info', title: 'Swap Successful'});
              }
            } catch (error) {
              setIsLoading(false);
              showToast({type: 'error', title: error.message});
            }
          }
        },
        onError(error) {
          setIsLoading(false);
          showToast({type: 'error', title: error.message});
        },
      },
    );
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
              disabled={isLoading}
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
          <TouchableOpacity onPress={() => handleExecute()} style={styles.swapButton}>
            <Text style={styles.swapButtonText}>{isLoading ? 'Swapping...' : 'Swap'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => walletModalContext?.show()} style={styles.swapButton}>
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
