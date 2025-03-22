import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {useSearchUsers, useSendNote, useSendVideoEvent} from 'afk_nostr_sdk';
import * as ImagePicker from 'expo-image-picker';
import {useCallback, useEffect, useRef, useState} from 'react';
import React from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {GalleryIcon, SendIconContained, VideoIcon} from '../../../assets/icons';
import {LoadingSpinner} from '../../../components/Loading';
import VideoPlayer from '../../../components/VideoPlayer';
import {useNostrAuth, useStyles, useTheme} from '../../../hooks';
import {useFileUpload} from '../../../hooks/api';
import {usePinataVideoUpload} from '../../../hooks/api/useFileUpload';
import {useToast} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {SelectedTab} from '../../../types/tab';
import {getImageRatio} from '../../../utils/helpers';
import {pubkeyToNprofile} from '../../../utils/nostr';
import stylesheet from './styles';

// We're using built-in components for emoji and Markdown
// since we want to make sure it works with the current dependency setup

export const FormCreatePost: React.FC = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const fileUpload = useFileUpload();
  const sendNote = useSendNote();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const [note, setNote] = useState<string | undefined>();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | undefined>();
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.NOTES);
  const navigation = useNavigation<MainStackNavigationProps>();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const videoPinataUpload = usePinataVideoUpload();
  const sendVideoEvent = useSendVideoEvent();
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | any>();

  const [tags, setTags] = useState<string[][]>([]);
  const inputRef = useRef<TextInput>(null);

  // New state variables for our features
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionTriggerPosition, setMentionTriggerPosition] = useState<number | null>(null);
  
  // User search for mentions
  // Use simplified search - the results will include profiles with metadata
  const searchUsers = useSearchUsers({
    search: searchQuery?.length > 0 ? searchQuery : undefined,
  });
  
  // Track cursor position for inserting emojis and mentions
  const updateCursorPosition = (selection: {start: number; end: number}) => {
    setCursorPosition(selection.start);
  };

  const onGalleryPress = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      exif: false,
      quality: 0.75,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) return;
    setImage(pickerResult.assets[0]);
  };

  const handleVideoSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      selectionLimit: 1,
      exif: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setVideo(asset);
    }
  };

  const handleSendNote = async () => {
    // if (!note || note?.trim()?.length == 0) {
    //   showToast({type: 'error', title: 'Please write your note'});
    //   return;
    // }

    if (!note?.trim().length && !image && !video) {
      showToast({type: 'error', title: 'Please add a note, image, or video'});
      return;
    }

    const isAuth = await handleCheckNostrAndSendConnectDialog();
    if (!isAuth) return;

    let imageUrl: string | undefined;

    if (image) {
      const result = await fileUpload.mutateAsync(image);
      if (result.data.url) imageUrl = result.data.url;
    }

    if (video) {
      videoPinataUpload.mutate(video, {
        onSuccess(data) {
          const videoMetadata = {
            dimension: `${video.width}x${video.height}`,
            url: data.url,
            sha256: data.id, // Assuming ipfs hash is SHA256
            mimeType: 'video/mp4', //Making this default
            imageUrls: [], // Thumbnail can be added future
            fallbackUrls: [],
            useNip96: false,
          };
          sendVideoEvent.mutate(
            {
              content: note || '',
              title: 'Video Note',
              publishedAt: Math.floor(Date.now() / 1000),
              isVertical: video?.height > video?.width,
              videoMetadata: [videoMetadata],
              hashtags: tags.map((tag) => tag[1]),
            },
            {
              onSuccess() {
                showToast({type: 'success', title: 'Note sent successfully'});
                setVideo('');
                setNote('');
              },
              onError(error) {
                console.log(error, 'error');
                showToast({
                  type: 'error',
                  title: 'Error! Note could not be sent. Please try again later.',
                });
              },
            },
          );
        },
        onError() {
          showToast({
            type: 'error',
            title: 'Error! Error Uploading Video',
          });
        },
      });
    } else {
      try {
        sendNote.mutate(
          {
            content: note || '',
            tags: [
              ...tags,
              ...(image && imageUrl ? [['image', imageUrl, `${image.width}x${image.height}`]] : []),
            ],
          },
          {
            onSuccess() {
              showToast({type: 'success', title: 'Note sent successfully'});
              queryClient.invalidateQueries({queryKey: ['rootNotes']});
              navigation.goBack();
            },
            onError(e) {
              console.log('error', e);
              showToast({
                type: 'error',
                title: 'Error! Note could not be sent. Please try again later.',
              });
            },
          },
        );
      } catch (e) {
        console.log('sendNote error', e);
      }
    }
  };
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  const handleTextChange = (text: string) => {
    setNote(text);

    // Extract hashtags from the text
    const hashtags = text.match(/#\w+/g) || [];
    // Convert hashtags to the required format
    const hashtagTags = hashtags.map((tag) => ['t', tag.slice(1)]);
    
    // Extract mentions (will be processed by createMentionTags when finishing mention)
    const mentions = text.match(/@[a-zA-Z0-9_]+/g) || [];
    
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
    
    // Update tags state (mention p tags will be added when user selects a mention)
    setTags(hashtagTags);
  };
  
  // Create mention tags for nostr protocol
  const createMentionTags = (mentions: Array<{pubkey: string, name?: string}>) => {
    return mentions.map(mention => ['p', mention.pubkey]);
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
    
    // Set cursor position after the inserted emoji
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  // Handle user selection for mention
  const handleUserSelect = (user: any) => {
    if (note === undefined || mentionTriggerPosition === null) return;
    
    // Get user name or default to showing public key
    const displayName = user.profile?.name || user.profile?.displayName || 
                        user.pubkey.substring(0, 8);
    
    // Text before and after the mention
    const textBeforeMention = note.substring(0, mentionTriggerPosition);
    const textAfterMention = note.substring(cursorPosition);
    
    // Create nostr:nprofile format
    // Determine relays to include if available from user data
    const relays = user.relays || [];
    const nprofileUri = pubkeyToNprofile(user.pubkey, relays);
    
    // Format mention with user's display name 
    const mentionText = `@${displayName}`;
    
    // Update text and add p tag for the mention
    const updatedText = textBeforeMention + mentionText + textAfterMention;
    setNote(updatedText);
    
    // Add the mention to tags - NIP-10 spec: ['p', pubkey, recommended_relay_url, petname]
    // Include relay URLs if available
    if (relays && relays.length > 0) {
      setTags(prevTags => [...prevTags, ['p', user.pubkey, relays[0], displayName]]);
    } else {
      setTags(prevTags => [...prevTags, ['p', user.pubkey]]);
    }
    
    // Reset mention state
    setShowUserSearch(false);
    setMentionTriggerPosition(null);
    
    // Set focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
    setShowUserSearch(false); // Close user search if open
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={note}
              ref={inputRef}
              onChangeText={handleTextChange}
              onSelectionChange={(e) => updateCursorPosition(e.nativeEvent.selection)}
              autoFocus
              multiline={true}
              placeholder="Make a post"
              placeholderTextColor={theme.colors.inputPlaceholder}
            />

            {image && (
              <View style={styles.imageContainer}>
                <Image
                  source={{uri: image.uri}}
                  style={[styles.image, {aspectRatio: getImageRatio(image.width, image.height)}]}
                />
              </View>
            )}

            {video && (
              <View style={styles.videoContainer}>
                <VideoPlayer uri={video.uri} />
              </View>
            )}
            
            {/* User Search Results for Mentions */}
            {showUserSearch && searchUsers.data && searchUsers.data.pages.length > 0 && (
              <View style={styles.userSearchContainer}>
                <FlatList
                  data={searchUsers.data.pages.flatMap(page => page || [])}
                  keyExtractor={(item) => item.id}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.userSearchItem}
                      onPress={() => handleUserSelect(item)}
                    >
                      {item.profile?.picture && (
                        <Image 
                          source={{uri: item.profile.picture}}
                          style={styles.userAvatar}
                        />
                      )}
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {item.profile?.name || item.profile?.displayName || 'Anon'}
                        </Text>
                        <Text style={styles.userPubkey}>
                          {item.pubkey.substring(0, 8)}...
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.userSearchList}
                  contentContainerStyle={{paddingVertical: 8}}
                />
              </View>
            )}
          </View>

          <View style={styles.buttons}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <View style={styles.mediaButtons}>
                {/* Emoji Picker Button */}
                <Pressable onPress={toggleEmojiPicker}>
                  <Text style={styles.emojiButton}>😀</Text>
                </Pressable>
                
                {/* Markdown Help Button */}
                <Pressable onPress={() => {
                  showToast({
                    type: 'info',
                    title: 'Markdown supported',
                    message: 'You can use **bold**, *italic*, [links](url), and more!'
                  });
                }}>
                  <Text style={styles.markdownButton}>MD</Text>
                </Pressable>
                
                {!video && (
                  <Pressable onPress={onGalleryPress}>
                    <GalleryIcon width="24" height="24" color={theme.colors.red} />
                  </Pressable>
                )}

                {!image && (
                  <Pressable onPress={handleVideoSelect}>
                    <VideoIcon width="30" height="30" color={theme.colors.red} />
                  </Pressable>
                )}
              </View>
            </View>

            {videoPinataUpload.isPending || sendVideoEvent.isPending ? (
              <Pressable style={styles.sendButton}>
                <LoadingSpinner color={theme.colors.text} />
              </Pressable>
            ) : (
              <Pressable style={styles.sendButton} onPress={handleSendNote}>
                <SendIconContained width="56" height="56" color={theme.colors.primary} />
              </Pressable>
            )}
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
              <View style={styles.emojiGrid}>
                {/* Common emoji set */}
                <ScrollView style={{maxHeight: 200}}>
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
                  <View style={styles.emojiRow}>
                    {['🤝', '🙌', '💪', '👊', '🎮', '💻', '📱', '⚡'].map(emoji => (
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
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
