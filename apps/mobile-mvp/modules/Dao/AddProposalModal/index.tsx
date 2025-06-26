import { useAccount } from '@starknet-react/core';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '../../../components';
import { LoadingSpinner } from '../../../components/Loading';
import { useStyles, useTheme, useWaitConnection } from '../../../hooks';
import { useAddProposal } from '../../../hooks/dao/useAddProposal';
import { useToast, useWalletModal } from '../../../hooks/modals';
import stylesheet from './styles';

type Proposal = {
  tokenAddress: string;
  publicKey: string;
  starknetAddress: string;
};

export const AddProposalModal = ({ closeModal, dao }: { closeModal: () => void; dao?: any }) => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();
  const { showToast } = useToast();

  const account = useAccount();
  const walletModal = useWalletModal();
  const waitConnection = useWaitConnection();

  const [proposalName, setProposalName] = useState('');

  const { addProposal, isPending } = useAddProposal(dao.contractAddress);

  const handleAddProposal = async () => {
    if (!account.address) {
      walletModal.show();
      const result = await waitConnection();
      if (!result) return;
    }

    if (!proposalName) {
      showToast({ title: 'Token address is required', type: 'error' });
      return;
    }

    try {
      await addProposal(proposalName);
      closeModal();
      showToast({ title: 'Proposal created', type: 'success' });
    } catch (error) {
      closeModal();
      showToast({ title: 'Error creating DAO', type: 'error' });
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Add a proposal</Text>
        <Text style={styles.inputLabel}>Proposal name:</Text>
        <TextInput
          style={styles.input}
          placeholder="name"
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={proposalName}
          onChangeText={(text) => setProposalName(text)}
        />

        <TouchableOpacity
          disabled={isPending}
          style={isPending ? styles.modalButtonDisabled : styles.modalButton}
          onPress={handleAddProposal}
        >
          <Text style={styles.modalButtonText}>Add</Text>
          {isPending && <LoadingSpinner />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
