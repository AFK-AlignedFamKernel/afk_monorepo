import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	separator: {
		height: 1,
		backgroundColor: theme.colors.divider,
	},
}));
