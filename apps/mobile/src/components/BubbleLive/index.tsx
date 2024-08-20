import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useProfile} from 'afk_nostr_sdk';
import {Image, ImageSourcePropType, Pressable, View} from 'react-native';

// import {useProfile} from '../../hooks';
import {MainStackNavigationProps} from '../../types';
import {Text} from '../Text';
import styles from './styles';

export type StoryProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event: NDKEvent;
  profileProps?: NDKUserProfile;
};

export const BubbleLive: React.FC<StoryProps> = ({imageProps, name, profileProps, event}) => {
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const navigation = useNavigation<MainStackNavigationProps>();
  const handleNavigateToProfile = () => {
    if (!event?.id) return;
    navigation.navigate('Profile', {publicKey: event?.pubkey});
  };
  return (
    <View style={styles.container}>
      <Pressable onPress={handleNavigateToProfile}>
        <View style={styles.imageContainer}>
          {/* <Image source={profile?.cover ? { uri: profile?.cover } : require('../../../assets/feed/images/story-bg.png')} resizeMode="cover" /> */}
          <Image
            source={
              profile?.cover ? profile?.cover : require('../../../assets/feed/images/story-bg.png')
            }
            resizeMode="cover"
          />
          <Image
            style={styles.image}
            source={profile?.image ? profile?.image : require('../../assets/degen-logo.png')}
            // resizeMode="cover"
          />
        </View>

        <Text weight="medium" fontSize={13} style={styles.name}>
          {profile?.name ?? profile?.nip05 ?? profile?.displayName ?? 'Anon AFK'}
        </Text>
      </Pressable>
    </View>
  );
};
