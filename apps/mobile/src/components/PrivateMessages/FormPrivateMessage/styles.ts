import { Spacing, ThemedStyleSheet } from "../../../styles";

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
		position: 'relative',
	},
	headerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	backButton: {
		position: 'absolute',
		left: 10,
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
	commentInputContainer: {
		backgroundColor: theme.colors.surface,
	  },
	  commentInputContent: {
		gap: Spacing.small,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: Spacing.xsmall,
		paddingHorizontal: Spacing.pagePadding,
		backgroundColor: theme.colors.surface,
	  },
	  commentInput: {
		flex: 1,
		width: 'auto',
	  },
}));
