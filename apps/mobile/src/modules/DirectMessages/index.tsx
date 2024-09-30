import {useIncomingMessageUsers, useMyGiftWrapMessages} from 'afk_nostr_sdk';
import React, {useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {Conversation as ConversationPreview, Modalize} from '../../components';
import {Chat} from '../../components/PrivateMessages/Chat';
import {FormPrivateMessage} from '../../components/PrivateMessages/FormPrivateMessage';
import {useStyles, useTheme} from '../../hooks';
import stylesheet from './styles';

export const DirectMessages: React.FC = () => {
  const theme = useTheme();
  const modalizeRef = useRef<Modalize>(null);
  const styles = useStyles(stylesheet);

  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const {data, isPending} = useIncomingMessageUsers();

  const giftMessages = useMyGiftWrapMessages();
  console.log('giftMessages', giftMessages?.data?.pages);

  const onOpenMenu = () => {
    modalizeRef.current?.open();
  };

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  if (isPending) {
    return <ActivityIndicator></ActivityIndicator>;
  }

  return (
    <>
      <Modalize ref={modalizeRef}>
        <FormPrivateMessage handleClose={() => modalizeRef.current?.close()} />
      </Modalize>

      {data?.pages.flat().length === 0 ? (
        <View
          style={{
            height: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={styles.name}>You dont have any message</Text>
        </View>
      ) : (
        ''
      )}

      {selectedConversation ? (
        <Chat item={selectedConversation} handleGoBack={handleGoBack} />
      ) : (
        <View style={styles.container}>
          <FlatList
            data={data?.pages.flat()}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
              <ConversationPreview
                conversation={item}
                onPressed={() => setSelectedConversation(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
      {!selectedConversation && (
        <Pressable style={styles.messageNewUserButton} onPress={onOpenMenu}>
          <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
        </Pressable>
      )}
    </>
  );
};
