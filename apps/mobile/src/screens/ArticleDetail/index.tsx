import { useQueryClient } from '@tanstack/react-query';
import { useNote, useReplyNotes, useSendNote } from 'afk_nostr_sdk';
import { useState } from 'react';
import { FlatList, RefreshControl, View, Text, ActivityIndicator } from 'react-native';

import { Divider, Header, IconButton, Input, KeyboardFixedView } from '../../components';
import { useNostrAuth, useStyles } from '../../hooks';
import { useToast } from '../../hooks/modals';
import { Article } from '../../modules/Article';
import { ArticleDetailScreenProps } from '../../types';
import stylesheet from './styles';
import { InputArea } from '../../components/InputArea';

export const ArticleDetail: React.FC<ArticleDetailScreenProps> = ({ navigation, route }) => {
  const { postId, post, isArticle, isRepost, repostedEventProps, isBookmarked, isReplyView } = route.params;
  console.log('postId', postId);
  console.log('isArticle', isArticle);
  console.log('route.path', route.path);

  const styles = useStyles(stylesheet);

  const [comment, setComment] = useState('');
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

  const sendNote = useSendNote();
  const { data: note = post } = useNote({ noteId: postId });
  const comments = useReplyNotes({ noteId: note?.id });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleSendComment = async () => {
    if (!comment || comment?.trim().length == 0) {
      showToast({ type: 'error', title: 'Please write your comment' });
      return;
    }
    await handleCheckNostrAndSendConnectDialog();

    sendNote.mutate(
      { content: comment, tags: [['e', note?.id ?? '', '', 'root', note?.pubkey ?? '']] },
      {
        onSuccess() {
          showToast({ type: 'success', title: 'Comment sent successfully' });
          queryClient.invalidateQueries({ queryKey: ['replyNotes', note?.id] });
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


  if (!postId) {
    return (
      <View style={styles.container}>
        <Header
          showLogo={false}
          left={<IconButton icon="ChevronLeftIcon" size={24} onPress={navigation.goBack} />}
        />
        <View>
          <Text>Post not found</Text>
        </View>
      </View>
    )
  }

  if (note?.id !== postId) {
    return (

      <View style={styles.containerLoading}>
        {/* <Header
          showLogo={false}
          left={<IconButton icon="ChevronLeftIcon" size={24} onPress={navigation.goBack} />}
        // right={<IconButton icon="MoreHorizontalIcon" size={24} />}
        // title="Conversation"
        /> */}

        <ActivityIndicator></ActivityIndicator>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <Header
        showLogo={false}
        left={<IconButton icon="ChevronLeftIcon" size={24} onPress={navigation.goBack} />}
      // right={<IconButton icon="MoreHorizontalIcon" size={24} />}
      // title="Conversation"
      />

      <Divider />

      <View style={styles.content}>
        <FlatList
          style={styles.content}
          data={comments.data?.pages.flat()}
          automaticallyAdjustKeyboardInsets
          ListHeaderComponent={
            <>
              <View style={styles.post}>
                <Article event={note}
                  isArticle={isArticle}
                  isRepost={isRepost}
                  repostedEventProps={repostedEventProps}
                  isBookmarked={isBookmarked}
                  isReplyView={isReplyView}
                />
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
        />
      </View>

      <KeyboardFixedView containerProps={{ style: styles.commentInputContainer }}>
        <Divider />

        <View style={styles.commentInputContent}>
          <InputArea
            value={comment}
            onChangeText={setComment}
            containerStyle={styles.commentInput}
            placeholder="Comment"
          />

          <IconButton icon="SendIcon" size={24} onPress={handleSendComment} />
        </View>
      </KeyboardFixedView>
    </View>
  );
};
