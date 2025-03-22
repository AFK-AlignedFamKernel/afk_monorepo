import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

/**
 * A standalone component to test the updated form functionality
 * This can be imported and used in the CreateForm component
 * to test the emoji and mention features without depending on other parts
 */
export const TestFormFeatures: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Form Feature Test</Text>
      
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Emoji Picker</Text>
        <View style={styles.emojiGrid}>
          <View style={styles.emojiRow}>
            {['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '🎉'].map(emoji => (
              <TouchableOpacity 
                key={emoji} 
                style={styles.emojiItem}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>User Mention</Text>
        <View style={styles.userSearchItem}>
          <View style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Example User</Text>
            <Text style={styles.userPubkey}>npub123456...</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Markdown Support</Text>
        <Text style={styles.markdownExample}>**Bold** and *Italic* text</Text>
        <Text style={styles.markdownExample}>[Link](https://example.com)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featureContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  emojiGrid: {
    flexDirection: 'column',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiItem: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userPubkey: {
    fontSize: 12,
    color: '#666',
  },
  markdownExample: {
    padding: 4,
  },
});

export default TestFormFeatures;