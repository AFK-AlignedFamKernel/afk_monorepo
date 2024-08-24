import { ThemedStyleSheet } from "../../styles";

export default ThemedStyleSheet((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.divider,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginBottom: 5,
	},
	name: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.text,
	},
}));
