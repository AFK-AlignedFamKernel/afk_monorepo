import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import { Conversation as ConversationType } from '../../types/messages';
import { useStyles } from '../../hooks';
import stylesheet from './styles';

export type ConversationPreviewProps = {
	conversation: ConversationType;
	onPressed: () => void;
};

export const Conversation: React.FC<ConversationPreviewProps> = ({conversation, onPressed}) => {

	const styles = useStyles(stylesheet);

	const user = conversation.user;
	const avatar = user.avatar ? {uri: user.avatar } : require('../../assets/pepe-logo.png');

	return (
		<Pressable style={styles.container} onPress={onPressed}>
			<Image source={avatar} style={styles.avatar} />
			<View style={styles.textContainer}>
				<Text style={styles.name}>{user.name}</Text>
				<Text style={styles.handle}>{user.handle}</Text>
			</View>
		</Pressable>
	);
};
