import {NDKKind} from '@nostr-dev-kit/ndk';
import {useQueryClient} from '@tanstack/react-query';
import {useMessagesChannels, useNote, useReplyNotes, useSendMessageChannel} from 'afk_nostr_sdk';
import {useEffect, useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';

import {Divider, IconButton, Input, KeyboardFixedView} from '../../components';
import {useNostrAuth, useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {IChannelsMetadata} from '../../types/channels';
import {ChannelInfo} from '../ChannelCard/Card/ChannelInfo';
import {Post} from '../Post';
import stylesheet from './styles';

interface IChannelDetailComponent {
  navigation?: any;
  route?: any;
}
export const ChannelDetailComponent: React.FC<IChannelDetailComponent> = ({navigation, route}) => {
  const {postId, post} = route.params;

  const styles = useStyles(stylesheet);
  const theme = useTheme();

  const [comment, setComment] = useState('');

  const sendNote = useSendMessageChannel();
  const {data: note = post} = useNote({noteId: postId});
  const comments = useReplyNotes({noteId: note?.id});
  const notes = useMessagesChannels({noteId: note?.id});
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const [channelInfo, setChannelInfo] = useState<undefined | IChannelsMetadata>();
  useEffect(() => {
    const getChannel = async () => {
      if (!post?.content) return;
      const json = JSON.parse(post?.content?.toString());
      setChannelInfo(json);
    };

    if (post) getChannel();
  }, [post]);

  const [selectedReply, setSelectedReply] = useState<string | undefined>();

  const handleSendComment = async () => {
    if (!comment || comment?.length == 0) {
      showToast({type: 'error', title: 'Please write your comment'});
      return;
    }

    let tags = [['e', post?.id ?? '', '', 'root', note?.pubkey ?? '']];

    if (selectedReply && note?.id) {
      tags = [['e', note?.id ?? selectedReply ?? '', '', 'reply', note?.pubkey ?? '']];
    }

    await handleCheckNostrAndSendConnectDialog();

    sendNote.mutate(
      {
        content: comment,
        tags,
      },
      {
        onSuccess() {
          if (selectedReply) {
            showToast({type: 'success', title: 'Comment sent successfully'});
            queryClient.invalidateQueries({queryKey: ['replyNotes', note?.id]});
          } else {
            showToast({type: 'success', title: 'Message sent successfully'});
            queryClient.invalidateQueries({queryKey: ['messagesChannels', note?.id]});
          }
          setComment('');
        },
        onError() {
          showToast({
            type: 'error',
            title: 'Error! Comment could not be sent. Please try again later.',
          });
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          backgroundColor: theme?.theme?.colors?.background,
        }}
      >
        <ChannelInfo event={post}></ChannelInfo>
      </View>

      <View style={styles.content}>
        <FlatList
          style={styles.content}
          data={notes.data?.pages.flat()}
          automaticallyAdjustKeyboardInsets
          ListHeaderComponent={
            <>
              <View style={styles.post}>
                <Post event={note} />
              </View>

              <Divider />
            </>
          }
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({item}) => {
            if (item?.kind == NDKKind.ChannelMetadata) return <></>;
            return (
              <View style={styles.comment}>
                <Post asComment event={item} />
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={notes.isFetching} onRefresh={() => notes.refetch()} />
          }
          onEndReached={() => notes.fetchNextPage()}
        />
        {/* <FlatList
          style={styles.content}
          data={comments.data?.pages.flat()}
          automaticallyAdjustKeyboardInsets
          ListHeaderComponent={
            <>
              <View style={styles.post}>
                <Post event={note} />
              </View>

              <Divider />
            </>
          }
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Post asComment event={item} />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={comments.isFetching} onRefresh={() => comments.refetch()} />
          }
          onEndReached={() => comments.fetchNextPage()}
        /> */}
      </View>

      <KeyboardFixedView containerProps={{style: styles.commentInputContainer}}>
        <Divider />

        <View style={styles.commentInputContent}>
          <Input
            value={comment}
            onChangeText={setComment}
            containerStyle={styles.commentInput}
            placeholder="Send Message or Comment"
          />

          <IconButton icon="SendIcon" size={24} onPress={handleSendComment} />
        </View>
      </KeyboardFixedView>
    </View>
  );
};
