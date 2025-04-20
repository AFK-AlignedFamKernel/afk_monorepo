import { NDKEvent, NDKKind, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useState } from 'react';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Text, Button, Input } from '../../components';
import { useStyles } from '../../hooks';
import { Post } from '../Post';
import stylesheet from './styles';
import { UserCard } from './User';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from 'src/types';
import { NostrProfileInfoFiInterface } from 'src/types/infofi';
import { useVoteTip, VoteParams } from '../../hooks/infofi/useVote';
import { useAccount } from '@starknet-react/core';
export type UserCardProps = {
  profile?: NDKUserProfile;
  event?: NDKEvent;
  profileIndexer?: NostrProfileInfoFiInterface;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
  isReplyView?: boolean;
  isArticle?: boolean;
};
const hashtags = /\B#\w*[a-zA-Z]+\w*/g;

export const UserNostrCard: React.FC<UserCardProps> = ({ profile, event, profileIndexer, isRepostProps, isBookmarked, isReplyView, isArticle }) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const account = useAccount();

  const handleProfilePress = (userId?: string) => {
    if (profileIndexer?.nostr_id) {
      navigation.navigate('Profile', { publicKey: profileIndexer?.nostr_id });
    }
  };

  const { handleVoteStarknetOnly } = useVoteTip();


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
    handleVoteStarknetOnly(account?.account, voteParams,);
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
                  profile?.image ? { uri: profile.image } : require('../../assets/degen-logo.png')
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

        <View style={styles.formTipVote}>

          <Text style={styles.text}>Tip and boost user</Text>
          <Input
            placeholder="Amount"
            value={voteParams.amount.toString() || ''}
            onChangeText={(text) => setVoteParams({ ...voteParams, amount: text })}
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
