import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { GetInfoResponse, MintActiveKeys, MintAllKeysets } from '@cashu/cashu-ts';

// Import our Dexie hooks and API
import { useMintStorage, useProofsStorage } from '../hooks/useDexieStorage';
import { mintsApi, proofsApi, setupDatabase } from '../utils/database';
import { MintData } from 'afk_nostr_sdk';

export const DexieExample: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the hooks for reactive data
  const { value: mints, setValue: setMints } = useMintStorage();
  const { value: proofs, setValue: setProofs } = useProofsStorage();
  
  // Initialize the database
  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await setupDatabase();
        if (!success) {
          setError('Failed to initialize database');
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, []);
  
  // Example of using the API directly
  const handleAddTestMint = async () => {
    try {
      // Minimal implementations of required types
      const keys: MintActiveKeys = { keysets: {} };
      const keysets: MintAllKeysets = [{ id: 'test', keys: [] }];
      const info: GetInfoResponse = {
        name: 'Test Mint',
        pubkey: 'test-pubkey',
        version: '0.1.0',
        contact: [],
        nuts: { supported: [], deprecated: [] },
        // Other properties as needed
      };
      
      // Create a properly typed MintData object
      const newMint: MintData = {
        url: `https://testmint.com/${Date.now()}`,
        alias: `Test Mint ${Date.now()}`,
        units: ['sats', 'btc'],
        keys,
        keysets,
        info
      };
      
      // We can use either the API or the hook
      // API version:
      await mintsApi.add(newMint);
      
      // Hook version (updates UI automatically):
      setMints([...mints, newMint]);
    } catch (err) {
      setError(`Error adding mint: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Example of clearing data
  const handleClearMints = async () => {
    try {
      await mintsApi.setAll([]);
      // The hook will automatically update
    } catch (err) {
      setError(`Error clearing mints: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Initializing Dexie database...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => setError(null)} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dexie Database Example</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Add Test Mint" onPress={handleAddTestMint} />
        <View style={styles.buttonSpacer} />
        <Button title="Clear Mints" onPress={handleClearMints} />
      </View>
      
      <Text style={styles.sectionTitle}>Mints ({mints.length})</Text>
      <ScrollView style={styles.listContainer}>
        {mints.map((mint, index) => (
          <View key={mint.url} style={styles.item}>
            <Text style={styles.itemTitle}>{mint.alias}</Text>
            <Text style={styles.itemDetail}>URL: {mint.url}</Text>
            <Text style={styles.itemDetail}>Units: {mint.units.join(', ')}</Text>
          </View>
        ))}
        {mints.length === 0 && (
          <Text style={styles.emptyText}>No mints available</Text>
        )}
      </ScrollView>
      
      <Text style={styles.sectionTitle}>Proofs ({proofs.length})</Text>
      <ScrollView style={styles.listContainer}>
        {proofs.slice(0, 5).map((proof, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemTitle}>Proof {index + 1}</Text>
            <Text style={styles.itemDetail}>C: {proof.C ? proof.C.substring(0, 20) + '...' : 'N/A'}</Text>
            {/* Add more proof details as needed */}
          </View>
        ))}
        {proofs.length > 5 && (
          <Text style={styles.moreText}>And {proofs.length - 5} more...</Text>
        )}
        {proofs.length === 0 && (
          <Text style={styles.emptyText}>No proofs available</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonSpacer: {
    width: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  listContainer: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
  item: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
  },
  moreText: {
    textAlign: 'center',
    padding: 8,
    color: '#666',
    fontStyle: 'italic',
  },
}); 