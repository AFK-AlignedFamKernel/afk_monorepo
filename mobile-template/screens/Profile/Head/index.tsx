import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {Image, ImageSourcePropType, Pressable, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {UploadIcon} from '../../../assets/icons';
import {Avatar, IconButton} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
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

export const ProfileHead: React.FC<ProfileHeadProps> = ({
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

  const navigation = useNavigation<MainStackNavigationProps>();
  const [menuOpen, setMenuOpen] = useState(false);

  // const goToSettings = () => {
  //   setMenuOpen(menuOpen == true ? false : true);
  //   // navigation.navigate('Settings');
  // };
  // const handleSettings = () => {
  //   navigation.navigate("Settings")
  // }

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        <Image
          source={coverPhoto ?? require('../../../assets/pepe-logo.png')}
          style={styles.coverImage}
        />

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

            {/* {showSettingsButton && (
              <Menu
                open={menuOpen}
                onClose={() => {
                  handleSettings()
                  // setMenuOpen(false)
                }

                }
                handle={
                  <Pressable style={styles.settingsButton} onPress={goToSettings}>
                    <SettingsIcon width={20} height={20} color={theme.colors.text} />
                    <Text weight="semiBold" fontSize={14} style={styles.settingsButtonText}>
                      Settings
                    </Text>
                  </Pressable>
                }
              >
                <Menu.Item
                  label="Switch theme"
                  icon={theme.dark ? 'SunIcon' : 'MoonIcon'}
                  onPress={toggleTheme}
                />
              </Menu>
            )} */}

            {/* {showSettingsButton && (
              <Menu
                open={menuOpen}
                onClose={() => {
                  handleSettings() 
                  // setMenuOpen(false)
                }

                }
                handle={
                  <Pressable style={styles.settingsButton} onPress={goToSettings}>
                    <SettingsIcon width={20} height={20} color={theme.colors.text} />
                    <Text weight="semiBold" fontSize={14} style={styles.settingsButtonText}>
                      Settings
                    </Text>
                  </Pressable>
                }
              >
                <Menu.Item
                  label="Switch theme"
                  icon={theme.dark ? 'SunIcon' : 'MoonIcon'}
                  onPress={toggleTheme}
                />
              </Menu>
            )} */}

            {onCoverPhotoUpload && (
              <Pressable style={styles.coverUploadIcon} onPress={onCoverPhotoUpload}>
                <UploadIcon width={44} height={44} color={theme.colors.surface} />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Avatar
            size={AVATAR_SIZE}
            source={profilePhoto ?? require('../../../assets/pepe-logo.png')}
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
