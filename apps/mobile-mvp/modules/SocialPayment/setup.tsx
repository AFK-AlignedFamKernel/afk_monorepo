import {useAccount} from '@starknet-react/core';
import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useProfile} from 'afk_nostr_sdk';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, Linking, Platform, Pressable, Text, View} from 'react-native';

import Badge from '../../components/Badge';
import {useStyles} from '../../hooks';
import {useGetAuthUser} from '../../hooks/api/useLogin';
import {
  useConnectTwitter,
  useDisconnectTwitter,
  useGetTwitterAuthorizationLink,
} from '../../hooks/api/useSocial';
import {useToast} from '../../hooks/modals';
import {truncateAddress} from '../../utils/helpers';
import {KEY_STORE, retrieveValue, storeValue} from '../../utils/storage';
import {LoginStarknet} from '../Login/StarknetLogin';
import stylesheet from './styles';
import {SocialAccount} from './types';

const SOCIAL_ACCOUNTS: SocialAccount[] = [
  {platform: 'twitter', status: 'disconnected'},
  {platform: 'telegram', status: 'coming_soon'},
  {platform: 'instagram', status: 'coming_soon'},
];

export default function SetupScreen() {
  const queryClient = useQueryClient();

  const toast = useToast();
  const [isLinkingPlatform, setIsLinkingPlatform] = useState<string | null>(null);

  const {account, address} = useAccount();
  const {data: authUser} = useGetAuthUser(!!address);
  const {mutate: connectTwitter} = useConnectTwitter();
  const {mutate: disconnectTwitter, isPending: disconnectPending} = useDisconnectTwitter();
  const {publicKey} = useAuth();
  const {data: profile} = useProfile({publicKey});
  const styles = useStyles(stylesheet);

  const {data: twitterAuthUrl} = useGetTwitterAuthorizationLink(isLinkingPlatform === 'twitter');

  const auth = useMemo(() => {
    return authUser?.data?.data?.user;
  }, [authUser?.data?.data?.user]);

  const connectedAccounts = useMemo(() => {
    return auth?.socialAccounts || [];
  }, [auth]);

  const handleCallback = useCallback(async () => {
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        const codeVerifier = await retrieveValue(KEY_STORE.CODE_VERIFIER);
        if (codeVerifier && auth?.id) {
          connectTwitter(
            {code, codeVerifier, userId: auth?.id},
            {
              onSuccess() {
                toast.showToast({title: 'Twitter connected', type: 'success'});
                queryClient.invalidateQueries({queryKey: ['auth_user']});
              },
              onError() {
                toast.showToast({title: 'Error Connecting Twitter', type: 'error'});
              },
            },
          );
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } else {
      // Handle deep linking for mobile platforms
      console.log('Handle deep link callback for mobile platforms');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.id, connectTwitter]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  const handleOpenLink = useCallback(
    async (platform: string) => {
      if (!account || connectedAccounts.some((acc: any) => acc.platform.toLowerCase() === platform))
        return;

      setIsLinkingPlatform(platform);
      let authUrl;

      switch (platform) {
        case 'twitter':
          authUrl = twitterAuthUrl?.data?.data?.url;
          break;
        // Add cases for other platforms here
        default:
          console.warn(`Authentication for ${platform} is not implemented yet.`);
          setIsLinkingPlatform(null);
          return;
      }

      if (authUrl) {
        try {
          await storeValue(KEY_STORE.CODE_VERIFIER, twitterAuthUrl?.data?.data?.codeVerifier);

          if (Platform.OS === 'web') {
            window.location.href = authUrl;
          } else {
            const supported = await Linking.canOpenURL(authUrl);

            if (supported) {
              await Linking.openURL(authUrl);
            } else {
              console.warn(`Can't handle ${platform} authentication URL`);
            }
          }
        } catch (error) {
          console.error(`Error opening ${platform} auth link:`, error);
        } finally {
          setIsLinkingPlatform(null);
        }
      }
    },
    [
      account,
      connectedAccounts,
      twitterAuthUrl?.data?.data?.url,
      twitterAuthUrl?.data?.data?.codeVerifier,
      setIsLinkingPlatform,
    ],
  );

  const handleDisconnectTwitter = () => {
    disconnectTwitter(auth?.id, {
      onSuccess() {
        toast.showToast({title: 'Twitter Disconnected', type: 'success'});
        queryClient.invalidateQueries({queryKey: ['auth_user']});
      },
      onError() {
        toast.showToast({title: 'Error Disconnecting Twitter', type: 'error'});
      },
    });
  };

  const renderSocialButton = (acc: SocialAccount) => {
    const connectedAccount = connectedAccounts.find(
      (connectedAcc: any) => connectedAcc.platform.toLowerCase() === acc.platform,
    );
    const isConnected = !!connectedAccount && !!account;

    const buttonStyle = [
      styles.socialButton,
      acc.status === 'coming_soon' && styles.socialButtonDisabled,
      isConnected && styles.socialButton,
    ];

    const buttonText = isConnected
      ? connectedAccount.username
      : acc.status === 'coming_soon'
        ? 'Coming Soon'
        : `Link ${acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)}`;

    return (
      <View key={acc.platform} style={styles.socialButtonWrapper}>
        <Pressable
          key={acc.platform}
          style={buttonStyle}
          onPress={() => {
            if (!account || acc.status === 'coming_soon' || isConnected) return;
            handleOpenLink(acc.platform);
          }}
          disabled={!account || acc.status === 'coming_soon'}
          accessibilityRole="button"
          accessibilityState={{disabled: !account || acc.status === 'coming_soon' || isConnected}}
          accessibilityLabel={`${isConnected ? 'Connected to' : 'Connect'} ${acc.platform} account`}
        >
          <View style={styles.socialTextContainer}>
            <Text style={styles.socialPlatform}>
              {acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)}
            </Text>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
                gap: 8,
              }}
            >
              <Text style={styles.socialStatus}>{buttonText}</Text>

              {isConnected && (
                <Pressable disabled={disconnectPending} onPress={() => handleDisconnectTwitter()}>
                  <Badge value="Disconnect" />
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Payments</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.largeAvatar}>
            <Image
              style={{
                width: '100%',
                height: '100%',
              }}
              source={
                profile?.image ? {uri: profile.image} : require('../../assets/degen-logo.png')
              }
              accessibilityLabel="User profile picture"
            />
          </View>

          <LoginStarknet
            triggerConnect={!account}
            btnText="Connect Wallet"
            handleNavigation={() => console.log('')}
          >
            {account ? (
              <Text style={styles.address}>{truncateAddress(address || '')}</Text>
            ) : (
              <Text style={styles.address}>Connect Wallet</Text>
            )}
          </LoginStarknet>
        </View>

        <View style={styles.socialAccounts}>{SOCIAL_ACCOUNTS.map(renderSocialButton)}</View>
      </View>
    </View>
  );
}
