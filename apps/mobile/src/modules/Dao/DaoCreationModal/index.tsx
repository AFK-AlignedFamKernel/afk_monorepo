import { useAccount } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '../../../components';
import { LoadingSpinner } from '../../../components/Loading';
import { useNostrAuth, useStyles, useTheme } from '../../../hooks';
import { useCreateDao } from '../../../hooks/dao/useCreateDao';
import { useToast, useWalletModal } from '../../../hooks/modals';
import stylesheet from './styles';

type Dao = {
  tokenAddress: string;
  publicKey: string;
  starknetAddress: string;
};

export const CreateDaoModal = ({ handleModal }: { handleModal: () => void }) => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();

  const { showToast } = useToast();

  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const { publicKey } = useAuth();
  const account = useAccount();
  const walletModal = useWalletModal();

  const [tokenAddress, setTokenAddress] = useState('');

  const isInvalid = tokenAddress.length === 0 || !publicKey || !account.address;

  const { createDao, isPending } = useCreateDao();

  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();
      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  const handleCreateDao = async () => {
    const isConnected = await handleCheckNostrAndSendConnectDialog();

    if (!isConnected) {
      showToast({ title: 'Must be connected to Nostr', type: 'error' });
      return;
    }

    if (!tokenAddress) {
      showToast({ title: 'Token address is required', type: 'error' });
      return;
    }

    try {
      await createDao(tokenAddress);
    } catch (error) {
      showToast({ title: 'Error creating DAO', type: 'error' });
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Launch Your DAO!</Text>
        <Text style={styles.inputLabel}>Token for vote:</Text>
        <TextInput
          style={styles.input}
          placeholder="address"
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={tokenAddress}
          onChangeText={(text) => setTokenAddress(text)}
        />
        <Text style={styles.inputLabel}>Public Key:</Text>
        <TextInput style={styles.input} value={publicKey} editable={false} />
        <Text style={styles.inputLabel}>Starknet Address:</Text>
        <TextInput style={styles.input} value={account?.address} editable={false} />
        {!account.isConnected && (
          <TouchableOpacity onPress={onConnect}>
            <Text style={{ textDecorationLine: 'underline' }}>connect your wallet</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          disabled={isInvalid || isPending}
          style={isInvalid || isPending ? styles.modalButtonDisabled : styles.modalButton}
          onPress={handleCreateDao}
        >
          <Text style={styles.modalButtonText}>Launch</Text>
          {isPending && <LoadingSpinner />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleModal}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
