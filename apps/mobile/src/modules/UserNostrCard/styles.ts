import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 0.3,
    borderColor: theme.colors.cardBorder,
  },
  hashtagColor: {
    color: theme.colors.primary,
  },
  infoUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoProfile: {
    flex: 1,
    marginLeft: 12,
  },
  info: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarSection: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  infoSection: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 16,
    gap: 4,
  },
  
  
}));
