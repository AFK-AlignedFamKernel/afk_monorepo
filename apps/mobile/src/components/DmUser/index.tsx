import React from 'react';
import { Conversation as ConversationType } from '../../types/messages';
import { useStyles } from '../../hooks';
import { View, Image, Text } from 'react-native';
import { MessageInput } from '../PrivateMessageInput';
import { MessagesList } from '../PrivateMessages/MessagesList.tsx';
import stylesheet from './styles';
import { IconButton } from '../IconButton';
import { useSendPrivateMessage } from 'afk_nostr_sdk';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { useToast } from '../../hooks/modals';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '../Input';


interface IFormPrivateMessage {
	publicKey?: string;
	user?: NDKUser;
	receiverPublicKeyProps?: string
}
export const FormPrivateMessageInput: React.FC<IFormPrivateMessage> = ({ user, publicKey, receiverPublicKeyProps }) => {
	const styles = useStyles(stylesheet);
	const avatar = user?.profile?.banner ?? require('../../assets/pepe-logo.png');

	const [receiverPublicKey, setReceiverPublicKey] = React.useState(receiverPublicKeyProps)
	const [content, setContent] = React.useState<string | undefined>()
	const sendPrivateMessage = useSendPrivateMessage()
	const { showToast } = useToast()
	const queryClient = useQueryClient();

	const handleSendMessage = async (message: string) => {

		if (!content) {
			showToast({ title: "Please add a content", type: "error" })
			return;
		}

		if (!receiverPublicKey) {
			showToast({ title: "Please choose a Nostr public key", type: "error" })
			return;
		}

		//todo: integrate hook here
		//todo: encrypt message
		//todo: send message
		await sendPrivateMessage.mutateAsync(
			{ receiverPublicKey: receiverPublicKey, content, },
			{
				onSuccess: () => {

				},
			},
		);

	};

	return (
		<>
			{/* <View style={styles.header}>
				<IconButton icon="ChevronLeftIcon" size={20} onPress={handleGoBack} style={styles.backButton} />
				<View style={styles.headerContent}>
					<Image source={avatar} style={styles.avatar} />
					<Text style={styles.name}>{user.name}</Text>
				</View>
			</View> */}
			<View style={styles.container}>
				<Input value={receiverPublicKey} onChangeText={setReceiverPublicKey} placeholder="Receiver" />

				<MessageInput onSend={handleSendMessage} />
			</View>
		</>
	);
};
