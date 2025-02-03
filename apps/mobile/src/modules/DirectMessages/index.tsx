import { useAuth, useIncomingMessageUsers, useMyGiftWrapMessages } from 'afk_nostr_sdk';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { Button, Conversation as ConversationPreview, Modalize } from '../../components';
import { Chat } from '../../components/PrivateMessages/Chat';
import { FormPrivateMessage } from '../../components/PrivateMessages/FormPrivateMessage';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { ContactList } from '../Contacts/ContactList';
import stylesheet from './styles';
import TabSelector from '../../components/TabSelector';

export const DirectMessages: React.FC = () => {
  const theme = useTheme();
  const modalizeRef = useRef<Modalize>(null);
  const styles = useStyles(stylesheet);
  const { publicKey } = useAuth()
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('messages');

  const { data, isPending } = useIncomingMessageUsers();

  const giftMessages = useMyGiftWrapMessages();
  console.log('giftMessages', giftMessages?.data?.pages);

  const onOpenMenu = () => {
    modalizeRef.current?.open();
  };

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  // if (isPending) {
  //   return <ActivityIndicator></ActivityIndicator>;
  // }

  return (
    <>
      <Modalize ref={modalizeRef}>
        <FormPrivateMessage handleClose={() => modalizeRef.current?.close()} />
        <ContactList onClose={() => modalizeRef.current?.close()} ></ContactList>
      </Modalize>


      {!publicKey &&
        <View>
          <Text>Connect your Nostr account</Text>
          <Button onPress={() => {
            handleCheckNostrAndSendConnectDialog()
          }}>Connect</Button>
        </View>
      }
      {/* 
      {publicKey && isPending && !data &&
        <ActivityIndicator></ActivityIndicator>} */}

      {activeTab === 'contacts' && <ContactList onClose={() => setActiveTab('messages')} />}

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
            renderItem={({ item }) => (
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

      <TabSelector
        activeTab={activeTab}
        handleActiveTab={setActiveTab}
        buttons={[
          { tab: 'messages', title: 'Messages' },
          { tab: 'contacts', title: 'Contacts' },
          // {tab: 'followers', title: 'Contacts'},
        ]}
      />
      {/* {activeTab === 'contacts' && <DirectMessages />} */}
    </>
  );
};
