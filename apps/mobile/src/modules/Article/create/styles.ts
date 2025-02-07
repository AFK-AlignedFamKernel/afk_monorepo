import {ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
}));
