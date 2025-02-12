import { useAuth, useIncomingMessageUsers, useMyGiftWrapMessages } from 'afk_nostr_sdk';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

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

  const { data, isPending, refetch } = useIncomingMessageUsers();
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);

  const [messagesData, setMessages] = useState<any>([]);
  useEffect(() => {
    const processMessages = async () => {
      if (publicKey && !isProcessingMessages) {
        setIsProcessingMessages(true);
        try {
          await refetch();
        } catch (error) {
          console.error('Error processing messages:', error);
        } finally {
          setIsProcessingMessages(false);
        }
      }
    };

    if (publicKey) {
      processMessages();
    }
  }, [publicKey, refetch]);

  // New useEffect to refetch data when publicKey changes
  useEffect(() => {
    if (publicKey) {
      refetch();
    }
  }, [publicKey, refetch]);

  // Handle reconnection after modal auth
  useEffect(() => {
    const handleReconnection = async () => {
      if (publicKey && isProcessingMessages) {
        try {
          await refetch();
          // setMessages(data?.pages.flat());

        } catch (error) {
          console.error('Error refreshing messages after reconnection:', error);
        }
      }
    };

    handleReconnection();
  }, [publicKey, isProcessingMessages, refetch]);

  useEffect(() => {
    if (data && data?.pages?.flat().length > 0) {
      setMessages(data?.pages.flat());
    }
  }, [data]);

  const [isLoadedOneTime, setIsLoaderOnetTime] = useState(false);
  const giftMessages = useMyGiftWrapMessages();
  console.log('giftMessages', giftMessages?.data?.pages);

  console.log("data", data)
  useEffect(() => {

    console.log("publicKey", publicKey)
    refetch()

    if (publicKey && !isLoadedOneTime) {
      console.log("refetch")
      refetch()
      setIsLoaderOnetTime(true)
    }
  }, [publicKey, isLoadedOneTime])

  const onOpenMenu = () => {
    modalizeRef.current?.open();
  };

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  // if (isPending) {
  //   return <ActivityIndicator></ActivityIndicator>;
  // }

  const handleRefresh = () => {
    console.log("refetch")
    refetch()
  }

  return (
    <>
      <Modalize ref={modalizeRef}>
        <FormPrivateMessage handleClose={() => modalizeRef.current?.close()} />
        {/* <ContactList onClose={() => modalizeRef.current?.close()} ></ContactList> */}
      </Modalize>

      <Text>Direct messages to improve (WIP)</Text>
      {publicKey &&
        <Button onPress={handleRefresh}>Refresh</Button>
      }
      {/* <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal
        style={styles.actionToggle}
      >
        <Button
          style={styles.toggleButton}
        >
          Messages
        </Button>
        <Button
          style={styles.toggleButton}

          onPress={() => setActiveTab('contacts')}
        >
          Contact
        </Button>

      </ScrollView> */}

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


      {/* {isPending && <ActivityIndicator></ActivityIndicator>} */}
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
            data={messagesData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationPreview
                conversation={item}
                onPressed={() => setSelectedConversation(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          {/* <FlatList
            data={data?.pages.flat()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationPreview
                conversation={item}
                onPressed={() => setSelectedConversation(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          /> */}
        </View>
      )}
      {/* {!selectedConversation && (
        <Pressable style={styles.messageNewUserButton} onPress={onOpenMenu}>
          <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
        </Pressable>
      )} */}

      <Pressable style={styles.messageNewUserButton} onPress={onOpenMenu}>
        <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
      </Pressable>

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
