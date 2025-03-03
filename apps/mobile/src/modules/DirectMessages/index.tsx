import { useAuth, useContacts, useIncomingMessageUsers, useMyGiftWrapMessages, useRoomMessages } from 'afk_nostr_sdk';
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
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from '../../types';

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

  console.log("data", data)
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

    // if (publicKey && !isLoadedOneTime) {
    //   console.log("refetch")
    //   refetch()
    //   setIsLoaderOnetTime(true)
    // }
  }, [publicKey, isLoadedOneTime])

  const onOpenMenu = () => {
    modalizeRef.current?.open();
  };


  const [isBack, setIsBack] = useState(false);
  const handleGoBack = () => {
    setSelectedConversation(null);
    // setIsBack(true);
  };

  // if (isPending) {
  //   return <ActivityIndicator></ActivityIndicator>;
  // }

  const handleRefresh = () => {
    console.log("refetch")
    refetch()
  }
  // const queryClient = useQueryClient();

  const roomIds = selectedConversation ? [selectedConversation?.senderPublicKey, selectedConversation?.receiverPublicKey] : [];
  // console.log('roomIds', roomIds);
  const messagesSent = useRoomMessages({
    roomParticipants: roomIds ?? [],
  });
  // console.log('messagesSent', messagesSent.data?.pages.flat());

  const messagesSentState = React.useMemo(() => {

    if (roomIds.length === 0) {
      return [];
    }
    // if (isBack) {  
    //   queryClient.setQueryData(['messagesSent'], { pages: [], pageParams: [] });
    //   return [];
    // }
    // if (!selectedConversation) {
    //   queryClient.setQueryData(['messagesSent'], { pages: [], pageParams: [] });
    //   return [];
    // }

    if (isBack) {
      return [];
    }
    if (selectedConversation) {
      return messagesSent.data?.pages.flat() || [];
    }
    return [];
  }, [selectedConversation, messagesSent.data?.pages, isBack, handleGoBack]);



  const handleConnect = async () => {
    // navigation.navigate('Login')
    const connected = await handleCheckNostrAndSendConnectDialog()
    if (connected) {
      // setIsConnected(true)
    }
  }
  const contacts = useContacts();
  // console.log('contacts', contacts);
  const navigation = useNavigation<MainStackNavigationProps>();
  return (
    <>
      <Modalize ref={modalizeRef}>
        <FormPrivateMessage handleClose={() => modalizeRef.current?.close()} />
        {/* <ContactList onClose={() => modalizeRef.current?.close()} ></ContactList> */}
      </Modalize>

      <Text>Direct messages to improve (WIP)</Text>
      {/* {publicKey &&
        <Button onPress={handleRefresh}>Refresh</Button>
      } */}
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
            handleConnect()
            // navigation.navigate('Login')
            // handleCheckNostrAndSendConnectDialog()
          }}>Connect</Button>
        </View>
      }
      {/* 
      {publicKey && isPending && !data &&
        <ActivityIndicator></ActivityIndicator>} */}

      {activeTab === 'followers' && (
        <View>
          <Text>Followers</Text>
          <ScrollView showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <FlatList
              data={contacts.data?.flat()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {

                // get profile infos
                return (
                  <View key={item}>
                    <Text style={styles?.contactItem}>{item}</Text>
                  </View>
                )
              }}
            />
            {/* {contacts.data?.flat().map((contact) => (
            <View key={contact}>
              <Text style={styles?.contactItem}>{contact}</Text>
            </View>
          ))} */}
          </ScrollView>
        </View>
      )}

      {activeTab === 'contacts' &&
        <ScrollView showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <ContactList onClose={() => setActiveTab('messages')} />
        </ScrollView>
      }

      {activeTab === 'messages' && (
        <View>
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


          {/* TODO fix Messages state of the older conversation selected
Refetch and clean Decrypted message after handleGoBack */}
          {selectedConversation ? (
            <Chat item={selectedConversation} handleGoBack={handleGoBack} messagesSentParents={messagesSentState} />
          ) : (
            <View style={styles.container}>
              <FlatList
                data={messagesData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ConversationPreview
                    conversation={item}
                    onPressed={() => {
                      setSelectedConversation(item)
                      setIsBack(false)
                    }}
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

          {/* <Text>Messages</Text> */}
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
          { tab: 'followers', title: 'Followers' },
        ]}
      />
      {/* {activeTab === 'contacts' && <DirectMessages />} */}
    </>
  );
};
