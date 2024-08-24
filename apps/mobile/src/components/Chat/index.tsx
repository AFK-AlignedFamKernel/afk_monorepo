import React from 'react';
import { Conversation as ConversationType } from '../../types/messages';
import { useStyles } from '../../hooks';
import { View, Image, Text } from 'react-native';
import { MessageInput } from '../PrivateMessageInput';
import { MessagesList } from '../MessagesList.tsx';
import stylesheet from './styles';

export type ChatProps = {
	conversation: ConversationType;
};

export const Chat: React.FC<ChatProps> = ({ conversation }) => {

	const styles = useStyles(stylesheet);
	const user = conversation.user;
	const avatar = user.avatar ? {uri: user.avatar } : require('../../assets/pepe-logo.png');

	const handleSendMessage = (message: string) => {
		//todo: integrate hook here
		//todo: encrypt message
		//todo: send message
	};

	return (
		<>
			<View style={styles.header}>
				<Image source={avatar} style={styles.avatar} />
				<Text style={styles.name}>{user.name}</Text>
			</View>
			<View style={styles.container}>
				<MessagesList messages={conversation.messages} />
				<MessageInput onSend={handleSendMessage} />
			</View>
		</>
	);
};
