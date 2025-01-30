import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useAccount, useProvider} from '@starknet-react/core';
import {Fraction} from '@uniswap/sdk-core';
// import {useNostrContext} from '../../context/NostrContext';
import {useNostrContext} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, View} from 'react-native';
import {byteArray, cairo, CallData, getChecksumAddress, uint256} from 'starknet';

import {Button, Divider, Text} from '../../components';
import {ESCROW_ADDRESSES} from '../../constants/contracts';
import {CHAIN_ID} from '../../constants/env';
import {Entrypoint} from '../../constants/misc';
import {useStyles, useTheme, useWaitConnection} from '../../hooks';
import {useClaim, useEstimateClaim} from '../../hooks/api';
import {useTips} from '../../hooks/api/indexer/useTips';
import {useToast, useTransaction, useTransactionModal, useWalletModal} from '../../hooks/modals';
import {MainStackNavigationProps} from '../../types';
import {decimalsScale} from '../../utils/helpers';
import stylesheet from './styles';

export const TipsComponent: React.FC = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const [loading, setLoading] = useState<false | number>(false);

  const tips = useTips();
  const {ndk} = useNostrContext();

  const {provider} = useProvider();
  const account = useAccount();
  const {sendTransaction} = useTransaction({});
  const {hide: hideTransactionModal} = useTransactionModal();
  const claim = useClaim();
  const estimateClaim = useEstimateClaim();
  const walletModal = useWalletModal();
  const waitConnection = useWaitConnection();
  const {showToast} = useToast();
  const navigation = useNavigation<MainStackNavigationProps>();

  const onClaimPress = async (depositId: number) => {
    if (!account.address) {
      walletModal.show();
    }

    const connectedAccount = await waitConnection();
    if (!connectedAccount || !connectedAccount.address) return;

    setLoading(depositId);

    const deposit = await provider.callContract({
      contractAddress: ESCROW_ADDRESSES[CHAIN_ID],
      entrypoint: Entrypoint.GET_DEPOSIT,
      calldata: [depositId],
    });

    if (deposit[0] === '0x0') {
      showToast({
        type: 'error',
        title: 'This tip is not available anymore',
      });
      setLoading(false);
      return;
    }

    const tokenAddress = getChecksumAddress(deposit[3]);

    const getNostrEvent = async (gasAmount: bigint) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.Text;
      event.content = `claim: ${cairo.felt(depositId)},${cairo.felt(
        connectedAccount.address!,
      )},${cairo.felt(tokenAddress)},${gasAmount.toString()}`;
      event.tags = [];

      await event.sign();
      return event.rawEvent();
    };

    // Send the claim through the wallet
    const event = await getNostrEvent(BigInt(0));

    const signature = event.sig ?? '';
    const signatureR = signature.slice(0, signature.length / 2);
    const signatureS = signature.slice(signature.length / 2);

    const claimCalldata = CallData.compile([
      uint256.bnToUint256(`0x${event.pubkey}`),
      event.created_at,
      event.kind ?? 1,
      byteArray.byteArrayFromString(JSON.stringify(event.tags)),
      {
        deposit_id: cairo.felt(depositId),
        starknet_recipient: connectedAccount.address,
        gas_token_address: tokenAddress,
        gas_amount: uint256.bnToUint256(0),
      },
      {
        r: uint256.bnToUint256(`0x${signatureR}`),
        s: uint256.bnToUint256(`0x${signatureS}`),
      },
      uint256.bnToUint256(0),
    ]);

    const receipt = await sendTransaction([
      {
        contractAddress: ESCROW_ADDRESSES[CHAIN_ID],
        entrypoint: Entrypoint.CLAIM,
        calldata: claimCalldata,
      },
    ]);

    if (receipt?.transaction_hash) {
      hideTransactionModal();
      tips.refetch();
      showToast({type: 'success', title: 'Tip claimed successfully'});
    } else {
      const description = 'Please Try Again Later.';
      // if (receipt) {
      //   description = receipt.transaction_failure_reason.error_message;
      // }

      showToast({type: 'error', title: `Failed to claim the tip. ${description}`});
    }

    setLoading(false);
  };

  return (
    <View>
      <FlatList
        ListEmptyComponent={
          <View>
            <Text style={styles.text}>You don&apos;t have any tip atm.</Text>
            <Text>Create more notes on Nostr to receive Zap and Starknet tip</Text>
          </View>
        }
        contentContainerStyle={styles.flatListContent}
        data={tips.data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.transactionHash}
        renderItem={({item}) => {
          const amount = new Fraction(item.amount, decimalsScale(item.token.decimals)).toFixed(6);

          return (
            <View style={styles.tip}>
              <View style={styles.tokenInfo}>
                <View style={styles.token}>
                  <Text weight="semiBold" fontSize={17}>
                    {amount}
                  </Text>
                  <Text weight="bold" fontSize={17}>
                    {item.token.symbol}
                  </Text>
                </View>

                <View>
                  {item.depositId ? (
                    <>
                      {item.isClaimed ? (
                        <Button small variant="default" disabled>
                          Claimed
                        </Button>
                      ) : (
                        <Button
                          small
                          variant="primary"
                          onPress={() => onClaimPress(item.depositId)}
                          left={
                            loading === item.depositId ? (
                              <ActivityIndicator
                                size="small"
                                color={theme.colors.onPrimary}
                                style={styles.buttonIndicator}
                              />
                            ) : undefined
                          }
                        >
                          Claim
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button small variant="default" disabled>
                      Received
                    </Button>
                  )}
                </View>
              </View>

              <Divider direction="horizontal" />

              <View style={styles.senderInfo}>
                <View style={styles.sender}>
                  <Text weight="semiBold" color="text" numberOfLines={1} ellipsizeMode="middle">
                    {item.sender}
                  </Text>
                </View>

                {/* <View>
                  <Text weight="semiBold" color="textSecondary" fontSize={11}>
                    24/06/2024
                  </Text>
                </View> */}
              </View>
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={tips.isFetching} onRefresh={tips.refetch} />}
      />
    </View>
  );
};
