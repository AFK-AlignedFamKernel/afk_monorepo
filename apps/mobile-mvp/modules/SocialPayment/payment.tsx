import {Pressable, StyleSheet, Text, View} from 'react-native';

import {Transaction} from './types';

const INITIAL_TRANSACTIONS: Transaction[] = [];

export const PaymentView: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profile}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Hi, tsdev_</Text>
            <Text style={styles.subtitle}>Your Social Payments Account</Text>
          </View>
        </View>
        <View style={styles.socialAccounts}>
          <View style={styles.connectedAccount}>
            <Text style={styles.accountText}>X</Text>
            <Text style={styles.accountHandle}>tsdev_</Text>
          </View>
          {/* Add other social account placeholders */}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Social Pay Balance</Text>
          <View style={styles.actions}>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionIcon}>↑</Text>
              <Text style={styles.actionText}>Send</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionIcon}>+</Text>
              <Text style={styles.actionText}>Top Up</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionIcon}>↓</Text>
              <Text style={styles.actionText}>Receive</Text>
            </Pressable>
          </View>
          <Text style={styles.balance}>$0.00</Text>
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, styles.activeTab]}>
              <Text style={styles.tabText}>Tokens</Text>
            </Pressable>
            <Pressable style={styles.tab}>
              <Text style={styles.tabText}>Nfts</Text>
            </Pressable>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tokens</Text>
            <Text style={styles.emptyStateSubtitle}>Top up your balance</Text>
            <Pressable style={styles.topUpButton}>
              <Text style={styles.topUpButtonText}>Top up</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Age</Text>
              <Text style={styles.tableHeaderText}>Address</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
              <Text style={styles.tableHeaderText}>Hash</Text>
            </View>
            {INITIAL_TRANSACTIONS.length === 0 ? (
              <Text style={styles.noResults}>No results.</Text>
            ) : (
              INITIAL_TRANSACTIONS.map((transaction, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{transaction.type}</Text>
                  <Text style={styles.tableCell}>{transaction.age}</Text>
                  <Text style={styles.tableCell}>{transaction.address}</Text>
                  <Text style={styles.tableCell}>{transaction.amount}</Text>
                  <Text style={styles.tableCell}>{transaction.hash}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
  },
  socialAccounts: {
    flexDirection: 'row',
    gap: 12,
  },
  connectedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  accountText: {
    color: '#fff',
  },
  accountHandle: {
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
  },
  balanceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    color: '#fff',
    fontSize: 24,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
  },
  balance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  topUpButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  table: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableHeaderText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableCell: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  noResults: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
