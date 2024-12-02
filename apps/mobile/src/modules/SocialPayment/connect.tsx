import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {WalletOption} from './types';

const WALLET_OPTIONS: WalletOption[] = [
  {id: 'argent-x', name: 'Argent X', icon: require('../assets/argent-x.png')},
  {id: 'braavos', name: 'Install Braavos', icon: require('../assets/braavos.png')},
  {id: 'argent-mobile', name: 'Argent Mobile', icon: require('../assets/argent-mobile.png')},
];

export default function ConnectScreen({navigation}: any) {
  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.logo}>AFK MONEY</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>×</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Connect</Text>
          <Text style={styles.subtitle}>Enter the Smart Payments Hub</Text>

          <ScrollView style={styles.walletOptions}>
            {WALLET_OPTIONS.map((wallet) => (
              <Pressable
                key={wallet.id}
                style={styles.walletButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.walletName}>{wallet.name}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>show more ˅</Text>
            </Pressable>
          </ScrollView>

          <Text style={styles.disclaimer}>
            By connecting a wallet, you agree to AFK Money Terms of Service and Privacy Policy.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Starknet Ecosystem?</Text>
            <Pressable>
              <Text style={styles.learnMore}>Learn more</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#111',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
  },
  content: {
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 24,
  },
  walletOptions: {
    gap: 12,
    marginBottom: 24,
  },
  walletButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  walletName: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  showMoreButton: {
    alignItems: 'center',
    padding: 8,
  },
  showMoreText: {
    color: '#666',
    fontSize: 14,
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  learnMore: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
