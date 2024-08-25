import { ThemedStyleSheet } from "../../styles";

export default ThemedStyleSheet((theme) => ({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.divider,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 10,
	},
	textContainer: {
		flex: 1,
	},
	name: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.text,
	},
	handle: {
		fontSize: 14,
		color: theme.colors.textSecondary
	},
}));
