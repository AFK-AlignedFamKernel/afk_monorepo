import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {useSendNote, useSendVideoEvent} from 'afk_nostr_sdk';
import * as ImagePicker from 'expo-image-picker';
import {useRef, useState} from 'react';
import React from 'react';
import {Image, KeyboardAvoidingView, Pressable, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {GalleryIcon, SendIconContained, UploadIcon, VideoIcon} from '../../../assets/icons';
import VideoPlayer from '../../../components/VideoPlayer';
import {useNostrAuth, useStyles, useTheme} from '../../../hooks';
import {useFileUpload} from '../../../hooks/api';
import {usePinataVideoUpload} from '../../../hooks/api/useFileUpload';
import {useToast} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {SelectedTab} from '../../../types/tab';
import {getImageRatio} from '../../../utils/helpers';
import stylesheet from './styles';

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
    if (!note || note?.trim()?.length == 0) {
      showToast({type: 'error', title: 'Please write your note'});
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
            sha256: data.cid, // Assuming CID can be used as SHA256
            mimeType: data.mime_type,
            imageUrls: [], // You might want to generate or upload a thumbnail
            fallbackUrls: [],
            useNip96: false,
          };
          sendVideoEvent.mutate(
            {
              content: note,
              title: data?.name,
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
      });
    } else {
      try {
        sendNote.mutate(
          {
            content: note,
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

    // Convert hashtags to the required format and update tags state
    const newTags = hashtags.map((tag) => ['t', tag.slice(1)]);
    setTags(newTags);
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
          </View>

          <View style={styles.buttons}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <View style={styles.mediaButtons}>
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
              ''
            ) : (
              <Pressable style={styles.sendButton} onPress={handleSendNote}>
                <SendIconContained width="56" height="56" color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
