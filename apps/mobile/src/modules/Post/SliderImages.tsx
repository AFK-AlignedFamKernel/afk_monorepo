import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import {
  useBookmark,
  useProfile,
  useReact,
  useReactions,
  useReplyNotes,
  useRepost,
} from 'afk_nostr_sdk';
// import { useAuth } from '../../store/auth';
import { useAuth } from 'afk_nostr_sdk';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { ActivityIndicator, Image, Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CommentIcon, LikeFillIcon, LikeIcon, RepostIcon } from '../../assets/icons';
import { Avatar, Icon, IconButton, Menu, Text } from '../../components';
import Badge from '../../components/Badge';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { useTipModal, useToast } from '../../hooks/modals';
import { MainStackNavigationProps } from '../../types';
import { getImageRatio, removeHashFn, shortenPubkey } from '../../utils/helpers';
import { getElapsedTimeStringFull } from '../../utils/timestamp';
import { ContentWithClickableHashtags } from '../PostCard';

import stylesheet from './styles';
import { useIsDesktop } from '../../hooks/useIsDesktop';

export type PostProps = {
  imgUrls?: string[];
};

export const SliderImages: React.FC<PostProps> = ({
  imgUrls
}) => {
  const isDesktop = useIsDesktop()

  // const styles = useStyles(stylesheet);

  const [currentIndex, setCurrentIndex] = useState(0);
  const slideOffset = useSharedValue(0);

  const nextImage = () => {
    if (!imgUrls || currentIndex >= imgUrls.length - 1) return;
    slideOffset.value = withSpring(-1);
    setCurrentIndex(prev => prev + 1);
    slideOffset.value = withSpring(0);
  };

  const prevImage = () => {
    if (currentIndex <= 0) return;
    slideOffset.value = withSpring(1);
    setCurrentIndex(prev => prev - 1);
    slideOffset.value = withSpring(0);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(slideOffset.value * 300) }
      ]
    };
  });

  if (!imgUrls?.length) return null;


  return (
    <View style={{
      width: '100%',
      height: "100%",
      minHeight: 300,
      maxHeight: isDesktop ? 750 : 550,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Animated.View style={[{
        width: '100%',
        height: '100%',
        maxHeight: '350px',
      }, animatedStyle]}>
        <Image
          source={{ uri: imgUrls[currentIndex] }}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '350px',
            resizeMode: 'cover'
          }}
        />
      </Animated.View>

      {currentIndex > 0 && (
        <Pressable
          onPress={prevImage}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20
          }}
        >
          <Text style={{ color: '#fff' }}>←</Text>
        </Pressable>
      )}

      {imgUrls && currentIndex < imgUrls.length - 1 && (
        <Pressable
          onPress={nextImage}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20
          }}
        >
          <Text style={{ color: '#fff' }}>→</Text>
        </Pressable>
      )}

      <View style={{
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5
      }}>
        {imgUrls.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)'
            }}
          />
        ))}
      </View>
    </View>
  );

};
