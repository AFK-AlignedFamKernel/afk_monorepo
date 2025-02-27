import React, { useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components';
import Loading from '../../components/Loading';
import { useStyles } from '../../hooks';
import { useDaoList } from '../../hooks/api/indexer/useDaos';
import { useDimensions } from '../../hooks/useWindowDimensions';
import { DaoCard } from '../../modules/Dao/DaoCard';
import { CreateDaoModal } from '../../modules/Dao/DaoCreationModal';
import stylesheet from './styles';

export const DAOComponent: React.FC = () => {
  const styles = useStyles(stylesheet);

  const [isModalVisible, setModalVisible] = useState(false);

  const { isDesktop } = useDimensions();

  const { data: daoList, isLoading, isFetching } = useDaoList();

  return (
    <View style={styles.container}>
      <Button
        onPress={() => setModalVisible(true)}
        variant="primary"
        style={styles.createDaoButton}
        textStyle={styles.createDaoButtonText}
      >
        <Text>Create your DAO</Text>
      </Button>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <CreateDaoModal closeModal={() => setModalVisible(false)} />
      </Modal>

      <ScrollView>
        {isLoading ? (
          <Loading />
        ) : (
          <ScrollView
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, padding: 5 }}
          >
            <FlatList
              contentContainerStyle={styles.flatListContent}
              data={daoList}
              keyExtractor={(item) => item.contractAddress}
              key={`flatlist-${isDesktop ? 3 : 1}`}
              numColumns={isDesktop ? 3 : 1}
              renderItem={({ item }) => {
                return <DaoCard key={item.contractAddress} dao={item} />;
              }}
              refreshControl={<RefreshControl refreshing={isFetching} />}
            />
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
};
