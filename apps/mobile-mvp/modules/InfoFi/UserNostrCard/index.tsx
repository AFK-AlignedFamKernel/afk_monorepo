import { NDKEvent, NDKKind, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useState } from 'react';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Text, Button, Input } from 'src/components';
import { useTheme } from 'src/hooks';
import { useStyles } from 'src/hooks';
import stylesheet from './styles';
import { UserCard } from './User';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from 'src/types';
import { NostrProfileInfoFiInterface } from 'src/types/infofi';
import { useVoteTip, VoteParams } from 'src/hooks/infofi/useVote';
import { useAccount } from '@starknet-react/core';
import { NOSTR_FI_SCORING_ADDRESS } from 'common';
import { constants } from 'starknet';
import { formatUnits } from 'viem';
export type UserCardProps = {
  profile?: NDKUserProfile;
  contractAddressSubScore?: string;
  event?: NDKEvent;
  profileIndexer?: NostrProfileInfoFiInterface;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
  isReplyView?: boolean;
  isArticle?: boolean;
};
const hashtags = /\B#\w*[a-zA-Z]+\w*/g;

export const UserNostrCard: React.FC<UserCardProps> = ({ profile, event, profileIndexer,  contractAddressSubScore  }) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const {theme} = useTheme();
  const account = useAccount();

  const handleProfilePress = (userId?: string) => {
    if (profileIndexer?.nostr_id) {
      navigation.navigate('Profile', { publicKey: profileIndexer?.nostr_id });
    }
  };

  const { handleVoteStarknetOnly } = useVoteTip();

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  
  const voteParamsDefault: VoteParams = {
    nostr_address: profileIndexer?.nostr_id,
    vote: 'good',
    is_upvote: true,
    upvote_amount: "0",
    downvote_amount: "0",
    amount: "0",
    amount_token: "0",
  }

  const [voteParams, setVoteParams] = useState<VoteParams>(voteParamsDefault);
  const handleTipUser = () => {
    console.log('profileIndexer', profileIndexer);
    handleVoteStarknetOnly(voteParams, contractAddressSubScore ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]);
  }

  return (
    <View style={styles.container}>
      <View>

        <View style={styles.profileContainer}>
          <View style={styles.avatarSection}>
            <Pressable onPress={() => handleProfilePress(event?.pubkey)}>


              <Avatar
                size={50}
                source={
                  profile?.image ? { uri: profile.image } : require('src/assets/degen-logo.png')
                }
              />

            </Pressable>
          </View>

          <View style={styles.infoSection}>
            <Text
              weight="bold"
              fontSize={16}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {profile?.displayName || profile?.name || 'Anonymous'}
            </Text>

            <Text>{profileIndexer?.nostr_id}</Text>
            {/* <Text>{feltToAddress(BigInt("0x" + item.nostr_id))}</Text> */}
            <Text>{profileIndexer?.total_ai_score}</Text>
            <Text>{profileIndexer?.total_vote_score}</Text>

            {profile?.nip05 && (
              <Text
                color="textSecondary"
                fontSize={14}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                @{profile.nip05}
              </Text>
            )}

            {profile?.about && (
              <Text
                color="textTertiary"
                fontSize={14}
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ marginTop: 4 }}
              >
                {profile.about}
              </Text>
            )}
          </View>


        </View>

        <View style={[styles.statsContainer, {
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.cardBorder,
          marginTop: 12
        }]}>
          <View style={[styles.statItem, {
            alignItems: 'center',
            flex: 1
          }]}>
            <Text style={[styles.statLabel, {
              fontSize: 14,
              color: theme.colors.text,
              opacity: 0.7,
              marginBottom: 4
            }]}>AI Score</Text>
            <Text style={[styles.statValue, {
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary
              }]}>{formatDecimal(profileIndexer?.total_ai_score)}</Text>
          </View>
          
          <View style={[styles.statItem, {
            alignItems: 'center', 
            flex: 1,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.inputBorder
          }]}>
            <Text style={[styles.statLabel, {
              fontSize: 14,
              color: theme.colors.text,
              opacity: 0.7,
              marginBottom: 4
            }]}>Vote Score</Text>
            <Text style={[styles.statValue, {
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary
            }]}>{formatDecimal(profileIndexer?.total_vote_score)}</Text>
          </View>
        </View>

        <View style={styles.formTipVote}>

          <Text style={styles.text}>Tip and boost user</Text>
          <Input
            placeholder="Amount"
            value={voteParams.amount.toString() || ''}
            onChangeText={(text) => setVoteParams({ ...voteParams, amount: text, amount_token: text, upvote_amount: text, downvote_amount: text })}
          />


          <Button
            onPress={handleTipUser}
          >
            <Text>Tip</Text>
          </Button>



        </View>
      </View>

    </View>
  );
};

const ClickableHashtag = ({ hashtag, onPress }: any) => {
  const styles = useStyles(stylesheet);
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.hashtagColor}>{hashtag}</Text>
    </Pressable>
  );
};

export const ContentWithClickableHashtags = ({ content, onHashtagPress }: any) => {
  const parts = content?.split(hashtags);
  const matches = content?.match(hashtags);

  return (
    <Text color="textTertiary" fontSize={13} lineHeight={20} weight='semiBold'>
      {parts.map((part: string, index: number) => (
        <React.Fragment key={index}>
          {part}
          {matches && index < parts.length - 1 && (
            <ClickableHashtag hashtag={matches[index]} onPress={onHashtagPress} />
          )}
        </React.Fragment>
      ))}
    </Text>
  );
};
