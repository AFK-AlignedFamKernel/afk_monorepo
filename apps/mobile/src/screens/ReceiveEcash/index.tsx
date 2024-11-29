/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {getDecodedToken, Token} from '@cashu/cashu-ts';
import {useAuth, useCreateWalletEvent} from 'afk_nostr_sdk';
import {getRandomBytes, randomUUID} from 'expo-crypto';
import {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {InfoIcon} from '../../assets/icons';
import {Button, TextButton} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {usePayment} from '../../hooks/usePayment';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  usePrivKeySignerStorage,
  useWalletIdStorage,
} from '../../hooks/useStorageState';
import {useCashuContext} from '../../providers/CashuProvider';
import {ReceiveEcashScreenProps} from '../../types';
import stylesheet from './styles';

export const ReceiveEcash: React.FC<ReceiveEcashScreenProps> = ({navigation, route}) => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();
  const {showToast} = useToast();

  const [tokenInfo, setTokenInfo] = useState<Token>();
  const [isProcessing, setIsProcessing] = useState(false);

  const {token} = route.params;

  const {publicKey, privateKey} = useAuth();

  const {handleReceiveEcash} = usePayment();
  const {mints, setMints, setActiveMint, buildMintData, setActiveUnit} = useCashuContext()!;
  const {value: mintsStorage, setValue: setMintsStorage} = useMintStorage();
  const {setValue: setActiveMintStorage} = useActiveMintStorage();
  const {setValue: setActiveUnitStorage} = useActiveUnitStorage();
  const {setValue: setPrivKey} = usePrivKeySignerStorage();
  const {setValue: setWalletId} = useWalletIdStorage();

  const {mutateAsync: createWalletEvent} = useCreateWalletEvent();

  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setTrigger(true);
    } else {
      const decodedToken = getDecodedToken(token);
      setTokenInfo(decodedToken);
      if (decodedToken && mintsStorage.length === 0) {
        const mintUrl = decodedToken.mint;
        handleAddMint(mintUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, token]);

  const handleAddMint = async (url: string) => {
    const defaultMintUrl = url;
    const defaultMintAlias = 'Mint';
    setActiveMintStorage(defaultMintUrl);
    setActiveMint(defaultMintUrl);
    const data = await buildMintData(defaultMintUrl, defaultMintAlias);
    setActiveUnitStorage(data.units[0]);
    setActiveUnit(data.units[0]);
    setMintsStorage([data]);
    setMints([data]);

    const privKey = getRandomBytes(32);
    const privateKeyHex = Buffer.from(privKey).toString('hex');
    setPrivKey(privateKeyHex);

    const id = randomUUID();
    setWalletId(id);

    if (publicKey && privateKey) {
      // nostr event
      await createWalletEvent({
        name: id,
        mints: mints.map((mint) => mint.url),
        privkey: privateKeyHex,
      });
    }
  };

  const handleReceive = async () => {
    setIsProcessing(true);
    const mintUrl = tokenInfo?.mint;
    if (mintUrl) {
      const mintAlreadyConfigured = mintsStorage?.some((mint) => mint.url === mintUrl) || false;
      if (!mintAlreadyConfigured) {
        showToast({type: 'info', title: 'Configuring mint...', timeout: 3000});

        const data = await buildMintData(mintUrl, '');
        setActiveMint(mintUrl);
        setActiveMintStorage(mintUrl);
        setActiveUnit(tokenInfo.unit || data.units[0]);
        setActiveUnitStorage(tokenInfo.unit || data.units[0]);
        const currentMints = mintsStorage ?? [];
        setMints([...currentMints, data]);
        setMintsStorage([...currentMints, data]);
        showToast({type: 'info', title: 'Mint configured!', timeout: 3000});
      }
      showToast({type: 'info', title: 'Receiving ecash...', timeout: 3000});
      const response = await handleReceiveEcash(token);
      if (!response) {
        showToast({type: 'error', title: 'Error processing payment.', timeout: 3000});
      } else {
        setIsProcessing(false);
        navigation.navigate('Wallet');
      }
    } else {
      showToast({type: 'error', title: 'No mint found.', timeout: 2000});
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const decodedToken = getDecodedToken(token);
    setTokenInfo(decodedToken);
  }, [token]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={() => navigation.navigate('Feed')}>
          Cancel
        </TextButton>
      </SafeAreaView>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!token ? (
          <Text style={styles.title}>No gift ecash token found.</Text>
        ) : (
          <>
            <Text style={styles.title}>Receive this ecash?</Text>
            <View style={styles.warningContainer}>
              <InfoIcon width={30} height={30} color={theme.colors.primary} />
              <Text style={styles.warning}>
                This will connect the mint <b>{tokenInfo?.mint}</b> to your session if it&apos;s not
                already configured.
              </Text>
            </View>
            <Button
              style={styles.receiveButton}
              textStyle={styles.receiveButtonText}
              onPress={handleReceive}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Receive'}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
};
