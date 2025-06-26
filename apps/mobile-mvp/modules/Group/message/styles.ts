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
    maxWidth: '70%',
    color: theme.colors.messageCardText,
    backgroundColor: theme.colors.messageCard,
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  replyContainer: {
    backgroundColor: theme.colors.messageReplyCard,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: 10,
    marginVertical: 5,
    borderLeftColor: theme.colors.blue,
    borderLeftWidth: 3,
  },
  replySender: {
    fontWeight: 'bold',
    fontSize: 12,
    color: theme.colors.messageReplyCardText,
    marginBottom: 2,
  },
  replyContentHighlight: {
    fontSize: 12,
    color: theme.colors.messageReplyCardText,
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
    paddingTop: 10,
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

  // Long Press Menu
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Keeping this as a non-theme-based color for overlay
  },
  menuContainer: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.text,
    borderRadius: Spacing.xsmall,
    color: theme.colors.text,
    padding: Spacing.small,
    minWidth: '70%',
  },
  menuItem: {
    padding: Spacing.small,
    color: theme.colors.text,
  },

  // Reply Indicator
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.messageCard,
    padding: Spacing.small,
    borderRadius: Spacing.xsmall,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.text,
    margin: Spacing.small,
  },
  replyContent: {
    flex: 1,
    color: theme.colors.text,
  },
  replyText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cancelButton: {
    marginLeft: Spacing.small,
    padding: Spacing.xsmall,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
}));
