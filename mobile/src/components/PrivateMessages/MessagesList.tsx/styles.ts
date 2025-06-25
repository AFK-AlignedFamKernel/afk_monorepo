import {ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  list: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
  },
  messageText: {
    color: theme.colors.text,
  },
}));
