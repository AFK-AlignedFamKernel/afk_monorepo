import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {ImageSourcePropType, Pressable, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {UploadIcon} from '../../../assets/icons';
import {Avatar, IconButton} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import stylesheet, {AVATAR_SIZE} from './styles';

export type ProfileHeadProps = {
  profilePhoto?: ImageSourcePropType;
  coverPhoto?: ImageSourcePropType;
  onCoverPhotoUpload?: () => void;
  onProfilePhotoUpload?: () => void;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  buttons?: React.ReactNode;
};

export const ChannelHead: React.FC<ProfileHeadProps> = ({
  profilePhoto,
  coverPhoto,
  onProfilePhotoUpload,
  onCoverPhotoUpload,
  showBackButton = true,
  showSettingsButton,
  buttons,
}) => {
  const {theme, toggleTheme} = useTheme();
  const styles = useStyles(stylesheet);

  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToSettings = () => {
    setMenuOpen(menuOpen == true ? false : true);
    // navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        {/* <Image
          source={coverPhoto ?? require('../../../assets/afk-logo.png')}
          style={styles.coverImage}
        /> */}

        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.coverButtons}>
            {showBackButton && (
              <IconButton
                icon="ChevronLeftIcon"
                size={20}
                style={styles.backButton}
                onPress={navigation.goBack}
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Avatar
            size={AVATAR_SIZE}
            source={profilePhoto ?? require('../../../assets/afk-logo.png')}
          />

          {onProfilePhotoUpload && (
            <Pressable style={styles.avatarUploadIcon} onPress={onProfilePhotoUpload}>
              <UploadIcon width={44} height={44} color={theme.colors.surface} />
            </Pressable>
          )}
        </View>

        <View style={styles.buttons}>{buttons}</View>
      </View>
    </View>
  );
};
