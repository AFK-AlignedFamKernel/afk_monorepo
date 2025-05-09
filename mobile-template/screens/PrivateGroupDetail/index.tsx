import {useQueryClient} from '@tanstack/react-query';
import {useNote, useReplyNotes} from 'afk_nostr_sdk';
import {useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';

import {Divider, IconButton, Input, KeyboardFixedView} from '../../components';
import {useNostrAuth, useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {Post} from '../../modules/Post';
import {PrivateGroupScreenProps} from '../../types';
import stylesheet from './styles';

export const PrivateGroupDetail: React.FC<PrivateGroupScreenProps> = ({navigation, route}) => {
  const {postId, post} = route.params;
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const styles = useStyles(stylesheet);
  const [comment, setComment] = useState('');
  // const sendNote = useSendNote();
  const {data: note = post} = useNote({noteId: postId});
  const comments = useReplyNotes({noteId: note?.id});
  const queryClient = useQueryClient();
  const {showToast} = useToast();

  return (
    <View style={styles.container}>
      {/* <Header
        showLogo={false}
        left={<IconButton icon="ChevronLeftIcon" size={24} onPress={navigation.goBack} />}
        right={<IconButton icon="MoreHorizontalIcon" size={24} />}
        title="Conversation"
      /> */}

      <Divider />

      <View style={styles.content}>
        <FlatList
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
          renderItem={({item}) => (
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

      <KeyboardFixedView containerProps={{style: styles.commentInputContainer}}>
        <Divider />

        <View style={styles.commentInputContent}>
          <Input
            value={comment}
            onChangeText={setComment}
            containerStyle={styles.commentInput}
            placeholder="Comment"
          />

          <IconButton
            icon="SendIcon"
            size={24}
            // onPress={handleSendComment}
          />
        </View>
      </KeyboardFixedView>
    </View>
  );
};
