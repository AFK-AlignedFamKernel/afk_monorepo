import {Connector} from '@wagmi/core';
import React, {useState} from 'react';
import {FlatList, Image, SafeAreaView, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {useAccount, useConnect, useDisconnect} from 'wagmi';

import {useStyles} from '../../hooks';
import stylesheet from './styles';
import {CONNECTOR_ICON_OVERRIDE_MAP, useOrderedConnections} from './walletUtil';

export const ConnectedWalletModal = () => {
  const {address, isConnected} = useAccount();
  const {disconnect} = useDisconnect();
  const styles = useStyles(stylesheet);
  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <View style={styles.connected_container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]}
            />
            <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>
          {isConnected && (
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {isConnected && (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Wallet Address</Text>
              <Text style={styles.infoValue}>{address}</Text>
            </View>
            {/* 
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Balance</Text>
              <Text style={styles.balanceText}>
                10 <Text style={styles.symbolText}>#</Text>
              </Text>
            </View> */}
          </>
        )}
      </View>
    </View>
  );
};

export default function WalletEvmModal({hide}: {hide: () => void}) {
  const styles = useStyles(stylesheet);
  const {connect} = useConnect();

  const connectors = useOrderedConnections();

  const handleConnect = (connector: Connector) => {
    connect({connector});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Connect a wallet</Text>
          <FlatList
            data={connectors}
            renderItem={({item}) => (
              <RenderConnector
                handleConnect={() => handleConnect(item)}
                connector={item as any}
                detected={item.isInjected as boolean}
              />
            )}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const RenderConnector = ({
  connector,
  handleConnect,
  detected,
}: {
  connector: Connector;
  handleConnect: () => void;
  detected: boolean;
}) => {
  const styles = useStyles(stylesheet);
  const connection = useConnect();
  const [ready, setReady] = useState(false);

  const isPendingConnection = connection.isPending && connection.variables?.connector === connector;

  React.useEffect(() => {
    (async () => {
      const provider = await connector.getProvider();
      setReady(!!provider);
    })();
  }, [connector]);
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id];

  const RightSideDetail = () => {
    if (isPendingConnection) {
      return <Text style={styles.smallText}>Loading...</Text>;
    }

    if (detected) {
      return <Text style={styles.smallText}>Detected</Text>;
    }

    return null;
  };

  return (
    <>
      <TouchableOpacity style={styles.connectorButton} onPress={handleConnect} disabled={!ready}>
        <View style={styles.buttonContent}>
          <View style={styles.connectorContent}>
            <Image source={icon} style={styles.icon} />

            <View>
              <Text style={styles.connectorText}>
                {connector.name}
                {/* {!connector.ready && ' (unsupported)'}
          {isLoading && connector.id === pendingConnector?.id && ' (connecting)'} */}
              </Text>
            </View>
          </View>
          <RightSideDetail />
        </View>
      </TouchableOpacity>
    </>
  );
};
