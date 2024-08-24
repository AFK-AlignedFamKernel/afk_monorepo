import {NDKKind} from '@nostr-dev-kit/ndk';
import React from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';

interface IFilterMenuProps {
  visible: boolean;
  onClose: () => void;
  kinds: NDKKind[];
  setKinds: (kinds: NDKKind[]) => void;
}

const NDK_KIND_OPTIONS = [
  {label: 'Text', value: NDKKind.Text},
  {label: 'Channel Creation', value: NDKKind.ChannelCreation},
  {label: 'Group Chat', value: NDKKind.GroupChat},
  {label: 'Channel Message', value: NDKKind.ChannelMessage},
  {label: 'Metadata', value: NDKKind.Metadata},
];

const FilterMenu: React.FC<IFilterMenuProps> = ({visible, onClose, kinds, setKinds}) => {
  const toggleKindSelection = (kind: NDKKind) => {
    if (kinds.includes(kind)) {
      setKinds(kinds.filter((k) => k !== kind));
    } else {
      setKinds([...kinds, kind]);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%'}}>
          <ScrollView>
            {NDK_KIND_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={{
                  padding: 10,
                  backgroundColor: kinds.includes(option.value) ? 'lightblue' : 'white',
                  borderRadius: 5,
                  marginBottom: 10,
                }}
                onPress={() => toggleKindSelection(option.value)}
              >
                <Text>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={{marginTop: 20, alignItems: 'center'}}>
            <Text>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default FilterMenu;
