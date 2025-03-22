import React, {useState} from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

/**
 * A standalone test page that can be accessed directly to test
 * the emoji picker and mention functionality without depending
 * on other parts of the app
 */
export const TestFeatures: React.FC = () => {
  const [note, setNote] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mentionTriggerPosition, setMentionTriggerPosition] = useState<number | null>(null);

  const dummyUsers = [
    { id: '1', name: 'John Doe', pubkey: 'npub1abc123', picture: null },
    { id: '2', name: 'Jane Smith', pubkey: 'npub2def456', picture: null },
    { id: '3', name: 'Bob Johnson', pubkey: 'npub3ghi789', picture: null },
  ];

  // Update cursor position for inserting emojis at specific location
  const updateCursorPosition = (selection: {start: number; end: number}) => {
    setCursorPosition(selection.start);
  };

  // Handle text changes and detect @ mentions
  const handleTextChange = (text: string) => {
    setNote(text);
    
    // Check if we're starting a mention
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);
    
    if (mentionMatch) {
      // If we just started typing a mention, show user search
      const searchText = mentionMatch[1];
      setSearchQuery(searchText);
      setShowUserSearch(true);
      if (mentionTriggerPosition === null) {
        setMentionTriggerPosition(textBeforeCursor.lastIndexOf('@'));
      }
    } else {
      // If we're not in a mention anymore, hide user search
      setShowUserSearch(false);
      setMentionTriggerPosition(null);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    if (note === undefined) {
      setNote(emoji);
      return;
    }
    
    // Insert emoji at cursor position
    const updatedText = 
      note.substring(0, cursorPosition) + 
      emoji + 
      note.substring(cursorPosition);
    
    setNote(updatedText);
    setShowEmojiPicker(false);
  };
  
  // Handle user selection for mention
  const handleUserSelect = (user: any) => {
    if (note === undefined || mentionTriggerPosition === null) return;
    
    // Get user name
    const displayName = user.name || user.pubkey.substring(0, 8);
    
    // Text before and after the mention
    const textBeforeMention = note.substring(0, mentionTriggerPosition);
    const textAfterMention = note.substring(cursorPosition);
    
    // Format mention with user's display name 
    const mentionText = `@${displayName}`;
    
    // Update text
    const updatedText = textBeforeMention + mentionText + textAfterMention;
    setNote(updatedText);
    
    // Reset mention state
    setShowUserSearch(false);
    setMentionTriggerPosition(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Test Features</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={handleTextChange}
          onSelectionChange={(e) => updateCursorPosition(e.nativeEvent.selection)}
          multiline={true}
          placeholder="Write a note..."
          placeholderTextColor="#999"
        />
        
        {/* User Search Results for Mentions */}
        {showUserSearch && (
          <View style={styles.userSearchContainer}>
            <FlatList
              data={dummyUsers.filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.userSearchItem}
                  onPress={() => handleUserSelect(item)}
                >
                  <View style={styles.userAvatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPubkey}>{item.pubkey}</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.userSearchList}
              contentContainerStyle={{paddingVertical: 8}}
            />
          </View>
        )}
      </View>
      
      <View style={styles.toolbar}>
        {/* Emoji Picker Button */}
        <TouchableOpacity 
          style={styles.toolbarButton}
          onPress={() => setShowEmojiPicker(true)}
        >
          <Text style={styles.emojiButton}>😀</Text>
        </TouchableOpacity>
        
        {/* Markdown Help Button */}
        <TouchableOpacity 
          style={styles.toolbarButton}
          onPress={() => {
            alert('Markdown supported: **bold**, *italic*, [links](url), etc.');
          }}
        >
          <Text style={styles.markdownButton}>MD</Text>
        </TouchableOpacity>
      </View>
      
      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Select Emoji</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.emojiGrid}>
            <View style={styles.emojiRow}>
              {['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '🎉'].map(emoji => (
                <TouchableOpacity 
                  key={emoji} 
                  style={styles.emojiItem}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.emojiRow}>
              {['👋', '🔥', '❤️', '🙏', '✅', '💯', '🚀', '🤣'].map(emoji => (
                <TouchableOpacity 
                  key={emoji} 
                  style={styles.emojiItem}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.emojiRow}>
              {['👀', '👻', '🧠', '🌈', '⭐', '🚨', '🎯', '🔍'].map(emoji => (
                <TouchableOpacity 
                  key={emoji} 
                  style={styles.emojiItem}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  form: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  input: {
    flex: 1,
    padding: 16,
    color: '#333',
    fontSize: 16,
    minHeight: 150,
  },
  userSearchContainer: {
    position: 'absolute',
    top: 150,
    left: 16,
    right: 16,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#eee',
  },
  userSearchList: {
    maxHeight: 200,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  userPubkey: {
    fontSize: 12,
    color: '#666',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
  },
  toolbarButton: {
    marginRight: 16,
  },
  emojiButton: {
    fontSize: 24,
  },
  markdownButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  emojiPickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 22,
    color: '#333',
    padding: 4,
  },
  emojiGrid: {
    backgroundColor: '#fff',
    padding: 16,
    maxHeight: 300,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emojiItem: {
    padding: 12,
  },
  emoji: {
    fontSize: 24,
  },
});

export default TestFeatures;