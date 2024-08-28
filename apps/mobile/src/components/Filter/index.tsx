import {NDKKind} from '@nostr-dev-kit/ndk';
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

import {useStyles} from '../../hooks';
import stylesheet from './styles';
import { SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';

interface IFilterMenuProps {
  visible: boolean;
  onClose: () => void;
  kinds: NDKKind[];
  setKinds: (kinds: NDKKind[]) => void;
  onSortChange: (sortBy: string) => void;
  activeSortBy: string;
}

const NDK_KIND_OPTIONS = [
  {label: 'Text', value: NDKKind.Text},
  {label: 'Channel Creation', value: NDKKind.ChannelCreation},
  {label: 'Group Chat', value: NDKKind.GroupChat},
  {label: 'Channel Message', value: NDKKind.ChannelMessage},
  {label: 'Metadata', value: NDKKind.Metadata},
];


// const SORT_OPTIONS = [
//   {label: 'Time', value: 'time'},
//   {label: 'For You', value: 'forYou'},
//   {label: 'Trending', value: 'trending'},
// ];

const SORT_OPTIONS = [
  {label: 'Time', value: SORT_OPTION_EVENT_NOSTR.TIME},
  {label: 'For You', value: SORT_OPTION_EVENT_NOSTR.FOR_YOU},
  {label: 'Trending', value: SORT_OPTION_EVENT_NOSTR.TRENDING},
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
  const {width} = useWindowDimensions();

  const containerStyle = [
    styles.container,
    {width: width > 768 ? '45%' : '90%'} as ViewStyle, // 45% for web, 90% for mobile
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
          <ScrollView>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.rowContainer}>
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.button, activeSortBy === option.value.toString() && styles.activeButton]}
                  onPress={() => onSortChange(option.value.toString())}
                >
                  <Text style={styles.buttonText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Filter By Type</Text>
            <View style={styles.container}>
              {NDK_KIND_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.button, kinds.includes(option.value) && styles.activeButton]}
                  onPress={() => toggleKindSelection(option.value)}
                >
                  <Text style={styles.buttonText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default FilterMenu;
