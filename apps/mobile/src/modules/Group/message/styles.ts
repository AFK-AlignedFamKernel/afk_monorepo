import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  //Start of All Group Styling
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  headerButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text,
  },
  backButton: {
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 24,
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '90%',
    color: theme.colors.messageCardText,
    backgroundColor: theme.colors.messageCard,
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  yourMessage: {
    alignSelf: 'flex-end',
    borderWidth: 1,
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontWeight: 'bold',
    color: theme.colors.messageCardText,
    marginBottom: 5,
  },
  messageText: {
    color: theme.colors.messageCardText,
    fontSize: 14,
    lineHeight: 20,
  },

  inputContainer: {
    backgroundColor: theme.colors.surface,
  },

  inputContent: {
    gap: Spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xsmall,
    paddingHorizontal: Spacing.pagePadding,
    backgroundColor: theme.colors.surface,
  },

  input: {
    flex: 1,
    width: 'auto',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  //End of All Group Styling
}));
