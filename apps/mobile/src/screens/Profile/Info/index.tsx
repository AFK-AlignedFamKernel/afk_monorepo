import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {useQueryClient} from '@tanstack/react-query';
// import {useAuth} from '../../../store/auth';
import {useAuth} from 'afk_nostr_sdk';
import {useContacts, useEditContacts, useProfile} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import {useState} from 'react';
import {Pressable, View} from 'react-native';

import {UserPlusIcon} from '../../../assets/icons';
import {Button, IconButton, Menu, Text} from '../../../components';
import {useNostrAuth, useStyles, useTheme} from '../../../hooks';
import {useTipModal, useToast} from '../../../hooks/modals';
import {ProfileScreenProps} from '../../../types';
import {ProfileHead} from '../Head';
import stylesheet from './styles';

export type ProfileInfoProps = {
  publicKey: string;
};

export const ProfileInfo: React.FC<ProfileInfoProps> = ({publicKey: userPublicKey}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const navigation = useNavigation<ProfileScreenProps['navigation']>();

  const {data: profile} = useProfile({publicKey: userPublicKey});

  const [menuOpen, setMenuOpen] = useState(false);
  const publicKey = useAuth((state) => state.publicKey);

  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const userContacts = useContacts({authors: [userPublicKey]});
  const contacts = useContacts({authors: [publicKey]});
  const editContacts = useEditContacts();
  const {show: showTipModal} = useTipModal();
  // const {show: showKeyModal} = useKeyModal();
  const account = useAccount();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const isSelf = publicKey === userPublicKey;
  const isConnected = contacts.data?.includes(userPublicKey);

  const onEditProfilePress = () => {
    navigation.navigate('EditProfile');
  };

  const onConnectionPress = async () => {
    const isNostrConnect = await handleCheckNostrAndSendConnectDialog();
    editContacts.mutateAsync(
      {pubkey: userPublicKey, type: isConnected ? 'remove' : 'add'},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({queryKey: ['contacts']});
        },
        onError: () => {
          showToast({
            type: 'error',
            title: isConnected ? 'Failed to unfollow user' : 'Failed to follow user',
          });
        },
      },
    );
  };

  const onCreateChannelPress = () => {
    navigation.navigate('CreateChannel');
  };

  const onCreatePress = () => {
    navigation.navigate('CreateForm');
  };

  const handleCopyPublicKey = async () => {
    await Clipboard.setStringAsync(userPublicKey);
    showToast({type: 'info', title: 'Public key copied to the clipboard'});
  };
  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleDefi = () => {
    navigation.navigate('Defi');
  };
  return (
    <View>
      <ProfileHead
        profilePhoto={profile?.image ? {uri: profile.image} : undefined}
        coverPhoto={profile?.banner ? {uri: profile.banner} : undefined}
        showSettingsButton={isSelf}
        buttons={
          isSelf ? (
            <>
              <Button
                small
                style={styles.secondaryButton}
                textStyle={styles.secondaryButtonText}
                onPress={onEditProfilePress}
              >
                Edit profile
              </Button>

              <IconButton
                icon="CoinIcon"
                size={20}
                // style={styles.backButton}
                onPress={handleDefi}
              />

              <IconButton
                icon="SettingsIcon"
                size={20}
                // style={styles.backButton}
                onPress={handleSettings}
              />

              <Menu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                handle={
                  <IconButton
                    icon="MoreVerticalIcon"
                    size={20}
                    style={styles.iconButton}
                    onPress={() => setMenuOpen(true)}
                  />
                }
              >
                <Menu.Item
                  label="Create"
                  //  icon="ShareIcon"
                  onPress={onCreatePress}
                ></Menu.Item>
                {/* <Menu.Item
                  label="Your Key"
                  //  icon="ShareIcon"
                  onPress={() => {
                    showKeyModal(publicKey as any, account?.address, KeyModalAction.INSTANTIATE);
                    setMenuOpen(false);
                  }}
                ></Menu.Item> */}
                <Menu.Item
                  label="Create channel"
                  //  icon="ShareIcon"
                  onPress={onCreateChannelPress}
                ></Menu.Item>
                <Menu.Item
                  label={profile?.username ? `Share @${profile.username}` : 'Share'}
                  icon="ShareIcon"
                />
                <Menu.Item label="About" icon="InfoIconCircular" />
              </Menu>
            </>
          ) : (
            <>
              <Button
                small
                variant={isConnected ? 'default' : 'secondary'}
                left={
                  <UserPlusIcon width={16} height={16} color="white" style={styles.buttonIcon} />
                }
                onPress={onConnectionPress}
              >
                {isConnected ? 'UnFollow' : 'Follow'}
              </Button>

              <IconButton
                icon="CoinIcon"
                size={20}
                // style={styles.backButton}
                onPress={() => {
                  showTipModal({pubkey: userPublicKey} as any);
                  setMenuOpen(false);
                }}
              />

              {/* <IconButton icon="DoubleMessageIcon" size={20} style={styles.iconButton} /> */}

              <Menu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                handle={
                  <IconButton
                    icon="MoreVerticalIcon"
                    size={20}
                    style={styles.iconButton}
                    onPress={() => setMenuOpen(true)}
                  />
                }
              >
                <Menu.Item
                  label={profile?.username ? `Tip @${profile.username}` : 'Tip'}
                  icon="CoinIcon"
                  onPress={() => {
                    showTipModal({pubkey: userPublicKey} as any);
                    setMenuOpen(false);
                  }}
                />
                {/* <Menu.Item
                  label={profile?.username ? `Share @${profile.username}` : 'Share'}
                  icon="ShareIcon"
                />
                <Menu.Item label="About" icon="InfoIconCircular" />
                <Menu.Item label="Report user" icon="FlagIcon" /> */}
              </Menu>
            </>
          )
        }
      />

      <View style={styles.info}>
        <Text weight="bold" fontSize={20} lineHeight={24}>
          {profile?.displayName ?? profile?.name}
        </Text>

        <View style={styles.usernameContainer}>
          {profile?.nip05 ? (
            <Text weight="medium" color="textSecondary" fontSize={16} style={styles.username}>
              @{profile.nip05}
            </Text>
          ) : null}

          <Pressable style={styles.publicKey}>
            <Text
              weight="medium"
              style={styles.publicKeyText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {userPublicKey}
            </Text>

            <IconButton
              size={16}
              icon="CopyIconStack"
              color="primary"
              onPress={handleCopyPublicKey}
            />
          </Pressable>
        </View>

        {profile?.about ? (
          <Text weight="medium" color="textSecondary" lineHeight={20} style={styles.bio}>
            {profile.about}
          </Text>
        ) : null}

        <View style={styles.connections}>
          <UserPlusIcon width={16} height={16} color={theme.colors.text} />

          <Text weight="semiBold">{userContacts.data?.length} Connections</Text>
        </View>
      </View>
    </View>
  );
};
