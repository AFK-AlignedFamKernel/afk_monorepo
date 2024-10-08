import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useConnect, useAccount} from 'wagmi';
import {TextButton} from '../../components';

const ConnectWalletScreen = () => {
  const {connect, connectors, error} = useConnect();
  // const { disconnect } = useDisconnect();
  const {address, isConnected} = useAccount();

  const handleConnect = async () => {
    const connector = connectors[0]; // Assuming the first connector is the one we want to use
    if (connector) {
      await connect({connector});
    }
  };

  const handleDisconnect = () => {
    // disconnect();
  };

  return (
    <View style={styles.container}>
      {isConnected ? (
        <View>
          <Text style={styles.text}>Connected Wallet: {address}</Text>
          <TextButton onPress={handleDisconnect}>Disconnect</TextButton>
        </View>
      ) : (
        <TextButton onPress={handleConnect}>Connect Wallet</TextButton>
      )}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
});

export default ConnectWalletScreen;
