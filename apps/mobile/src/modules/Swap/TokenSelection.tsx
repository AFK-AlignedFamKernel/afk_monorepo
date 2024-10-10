import {Feather} from '@expo/vector-icons';
import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {useStyles, useTheme} from '../../hooks';
import {useGetEvmTokens} from '../../starknet/evm/hooks';
import {IGetTokenReturnTypeObj} from '../../starknet/evm/types';
import styleSheet from './styles';
import {debounce} from './util';

interface TokenSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (token: IGetTokenReturnTypeObj) => void;
}

const RenderTokenItem = ({
  item,
  onSelect,
}: {
  item: IGetTokenReturnTypeObj;
  onSelect: (item: IGetTokenReturnTypeObj) => void;
}) => {
  const styles = useStyles(styleSheet);
  return (
    <TouchableOpacity style={styles.tokenItem} onPress={() => onSelect(item)}>
      <Image source={{uri: item.logo_url}} style={styles.tokenLogo} />
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenName}>{item.name}</Text>
        <Text style={styles.tokenSymbol}>{item.symbol}</Text>
      </View>
      <Text style={styles.tokenDecimals}>{item.decimals}</Text>
    </TouchableOpacity>
  );
};

export default function TokenSelectModal({visible, onClose, onSelect}: TokenSelectModalProps) {
  const theme = useTheme();
  const styles = useStyles(styleSheet);
  const [searchQuery, setSearchQuery] = useState('');

  const {data: tokens, isLoading} = useGetEvmTokens({search: searchQuery});

  const debouncedSearch = useMemo(() => debounce((text: string) => setSearchQuery(text), 300), []);

  const handleSearchChange = useCallback(
    (text: string) => {
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Token</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={theme.theme.colors.swap_text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tokens"
            onChangeText={handleSearchChange}
          />
          {isLoading ? (
            <View style={{height: 400}}>
              <Text style={styles.loadingText}>Loading tokens...</Text>
            </View>
          ) : (
            <FlatList
              style={{maxHeight: 400, minHeight: 400}}
              data={tokens}
              renderItem={({item}) => <RenderTokenItem onSelect={onSelect} item={item} />}
              keyExtractor={(item) => item.name}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={5}
              removeClippedSubviews={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
