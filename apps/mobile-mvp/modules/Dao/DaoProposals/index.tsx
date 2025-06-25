import React, { useState } from 'react';
import { Modal, View } from 'react-native';

import { Button, Text } from '../../../components';
import { useStyles } from '../../../hooks';
import { AddProposalModal } from '../AddProposalModal';
import stylesheet from './styles';

export type DaoProposalsProps = {
  dao: any;
};

export const DaoProposals: React.FC<DaoProposalsProps> = ({ dao }) => {
  const styles = useStyles(stylesheet);

  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Button
        onPress={() => setModalVisible(true)}
        variant="primary"
        style={styles.createButton}
        textStyle={styles.createButtonText}
      >
        <Text>Add a proposal</Text>
      </Button>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <AddProposalModal dao={dao} closeModal={() => setModalVisible(false)} />
      </Modal>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Proposal list</Text>
        </View>

        <View style={styles.divider} />
      </View>
    </View>
  );
};
