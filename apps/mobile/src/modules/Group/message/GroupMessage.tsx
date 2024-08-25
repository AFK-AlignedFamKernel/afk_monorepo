import React, {useState} from 'react';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {BackIcon, MenuIcons} from '../../../assets/icons';
import {IconButton, Input, KeyboardFixedView} from '../../../components';
import {useStyles} from '../../../hooks';
import {GroupChatScreenProps} from '../../../types';
import stylesheet from './styles';

const GroupChat: React.FC<GroupChatScreenProps> = ({navigation, route}) => {
  const styles = useStyles(stylesheet);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
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
  ]);

  const sendMessage = () => {
    if (message.trim() === '') return;
    setMessages([...messages, {id: Date.now().toString(), text: message, sender: 'You'}]);
    setMessage('');
  };

  const groupName = 'Project Team';
  const memberCount = 15;

  const renderMessage = ({item}: any) => (
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
        renderItem={renderMessage}
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

          <IconButton icon="SendIcon" size={24} />
        </View>
      </KeyboardFixedView>
    </SafeAreaView>
  );
};

export default GroupChat;
