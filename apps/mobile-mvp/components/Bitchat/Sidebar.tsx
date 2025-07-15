import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  currentChannel?: string;
  onChannelSelect: (channel: string) => void;
  onChannelLeave: (channel: string) => void;
  peers: string[];
  onPeerSelect: (peer: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  channels,
  currentChannel,
  onChannelSelect,
  onChannelLeave,
  peers,
  onPeerSelect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sidebar}>
        <Text style={styles.sectionTitle}>Channels</Text>
        <FlatList
          data={channels}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.channelRow}>
              <TouchableOpacity onPress={() => onChannelSelect(item)} style={styles.channelButton}>
                <Text style={[styles.channelName, item === currentChannel && styles.channelActive]}>{item}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onChannelLeave(item)}>
                <Text style={styles.leaveButton}>leave</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Peers</Text>
        <FlatList
          data={peers}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onPeerSelect(item)} style={styles.peerRow}>
              <Text style={styles.peerName}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#181818',
    padding: 16,
    zIndex: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#222',
  },
  sectionTitle: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  channelButton: {
    flex: 1,
  },
  channelName: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
  },
  channelActive: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  leaveButton: {
    color: '#FF5555',
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },
  peerRow: {
    paddingVertical: 6,
  },
  peerName: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 15,
  },
});

export default Sidebar; 