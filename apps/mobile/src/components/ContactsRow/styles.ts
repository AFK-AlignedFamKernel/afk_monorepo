import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  contactsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  contactsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addContactButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plusSign: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  contactAvatar: {
    alignItems: 'center',
    marginRight: 12,
    width: 50,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    width: '100%',
  },
}));