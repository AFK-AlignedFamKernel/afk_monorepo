import { NDKKind } from '@nostr-dev-kit/ndk';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import { useStyles } from '../../hooks';
import { SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';
import stylesheet from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface IFilterMenuProps {
  visible: boolean;
  onClose: () => void;
  kinds: NDKKind[];
  setKinds: (kinds: NDKKind[]) => void;
  onSortChange: (sortBy: string) => void;
  activeSortBy: string;
}

const NDK_KIND_OPTIONS = [
  { label: 'Text', value: NDKKind.Text },
  { label: 'Channel Creation', value: NDKKind.ChannelCreation },
  { label: 'Group Chat', value: NDKKind.GroupChat },
  { label: 'Channel Message', value: NDKKind.ChannelMessage },
  { label: 'Metadata', value: NDKKind.Metadata },
  { label: 'Stream', value: 30311 },
  { label: 'Video', value: NDKKind.HorizontalVideo },
  { label: 'Video shorts', value: NDKKind.VerticalVideo },
  { label: 'Article', value: NDKKind.Article },
];

const SORT_OPTIONS = [
  { label: 'Time', value: SORT_OPTION_EVENT_NOSTR.TIME },
];

const FilterMenu: React.FC<IFilterMenuProps> = ({
  visible,
  onClose,
  kinds,
  setKinds,
  onSortChange,
  activeSortBy,
}) => {
  const styles = useStyles(stylesheet);
  const { width } = useWindowDimensions();

  const containerStyle = [
    styles.container,
    { width: width > 768 ? '45%' : '90%' } as ViewStyle, // 45% for web, 90% for mobile
  ];

  const toggleKindSelection = (kind: NDKKind) => {
    if (kinds.includes(kind)) {
      setKinds(kinds.filter((k) => k !== kind));
    } else {
      setKinds([...kinds, kind]);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={containerStyle}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.sectionTitle}>Filter By Type</Text>
            <View style={styles.containerSort}>
              {NDK_KIND_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.button,
                    kinds.includes(option.value) && styles.activeButton,
                    width > 768 ? styles.itemDesktop : styles.item,
                  ]}
                  onPress={() => toggleKindSelection(option.value)}
                >
                  <Text style={styles.buttonText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default FilterMenu;