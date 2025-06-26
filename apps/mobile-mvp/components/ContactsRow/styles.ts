import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  contactsContainer: {
    padding: 10,
  },
  contactsTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
    color: theme.colors.text,
  },
  contactsContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    marginTop: 20,
  },
  addContactButton: {
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  addContactButtonText: {
    color: theme.colors.white,
  },
  contactsListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  contactContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    borderColor: theme.colors.divider,
    borderBottomWidth: 1,
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    color: theme.colors.text,
    width: '100%',
  },
  contactAddress: {
    fontSize: 12,
    color: theme.colors.text,
    width: '100%',
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
    right: 0,
  },
  actionButton: {
    backgroundColor: 'transparent',
    marginTop: Spacing.small,
    marginBottom: Spacing.small,
  },
}));
