import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useGetGroupMessages, useSendGroupMessages} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {BackIcon, MenuIcons} from '../../../assets/icons';
import {IconButton, Input, KeyboardFixedView} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatScreenProps} from '../../../types';
import stylesheet from './styles';

const data = [
  {id: '1', text: 'Hello everyone!', sender: 'Alice'},
  {id: '2', text: 'Hi Alice, how are you?', sender: 'Bob'},
  {id: '3', text: 'Im doing great, thanks!', sender: 'Alice'},
  {
    id: '4',
    text: 'Whats the plan for today? Whats the plan for today Whats the plan for todayWhats the plan for today',
    sender: 'Charlie',
  },
  {id: '5', text: 'Whats the plan for today?', sender: 'Charlie'},
  {id: '6', text: 'Whats the plan for today?', sender: 'Charlie'},
  {id: '7', text: 'Whats the plan for today?', sender: 'Charlie'},
  {id: '8', text: 'Whats the plan for today?', sender: 'Charlie'},
  {id: '9', text: 'Whats the plan for today?', sender: 'Charlie'},
];

const groupName = 'Project Team';
const memberCount = 15;

const GroupChat: React.FC<GroupChatScreenProps> = ({navigation, route}) => {
  const {publicKey} = useAuth();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {data: messageData} = useGetGroupMessages({
    groupId: route.params.groupId,
  });
  const {mutate} = useSendGroupMessages();

  console.log(messageData, 'data');
  const styles = useStyles(stylesheet);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(data);

  const sendMessage = () => {
    // let tags = [['e', post?.id ?? '', '', 'root', note?.pubkey ?? '']];

    mutate(
      {
        content: 'Hello World',
        groupId: route.params.groupId,
        pubkey: publicKey,
        // tag: ['h', route.params.groupId],
        tag: [],
      },
      {
        onSuccess(data) {
          console.log(data, 'data');

          showToast({type: 'success', title: 'Message sent successfully'});
          queryClient.invalidateQueries({queryKey: ['getGroupMessages', route.params.groupId]});
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <BackIcon stroke="gray" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>{memberCount} members</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupChatDetail', {groupId: route.params.groupId})}
          style={styles.headerButton}
        >
          <MenuIcons stroke="gray" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        renderItem={({item}) => <MessageCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted
      />

      <KeyboardFixedView containerProps={{style: styles.inputContainer}}>
        <View style={styles.inputContent}>
          <Input
            // value={comment}
            // onChangeText={setComment}
            containerStyle={styles.input}
            placeholder="Send Message"
          />

          <IconButton onPress={() => sendMessage()} icon="SendIcon" size={24} />
        </View>
      </KeyboardFixedView>
    </SafeAreaView>
  );
};

// TODO: MOVE TO COMPONENT
const MessageCard = ({item}: {item: (typeof data)[0]}) => {
  const styles = useStyles(stylesheet);
  return (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'You' ? styles.yourMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.senderName}>{item.sender}</Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );
};

export default GroupChat;
