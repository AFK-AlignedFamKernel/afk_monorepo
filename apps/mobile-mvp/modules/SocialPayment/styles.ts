import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: theme.colors.streamStudio_text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: theme.colors.streamStudio_surface,
    borderColor: theme.colors.streamStudio_inputBorder,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  address: {
    color: theme.colors.streamStudio_textSecondary,
    fontSize: 14,
    fontWeight: 'medium',
  },
  socialAccounts: {
    gap: 12,
  },
  socialButtonWrapper: {
    position: 'relative',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: theme.colors.streamStudio_surface,
    borderColor: theme.colors.swap_inputBorder,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.streamStudio_cardBackground,
    padding: 16,
  },
  socialButtonConnected: {
    backgroundColor: theme.colors.streamStudio_surface,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialPlatformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
    color: theme.colors.streamStudio_primary,
  },
  socialPlatform: {
    color: theme.colors.streamStudio_text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialStatus: {
    color: theme.colors.streamStudio_textSecondary,
    fontSize: 14,
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    width: 16,
    height: 16,
    color: theme.colors.streamStudio_textSecondary,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },

  menu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    padding: 10,
  },
  menuItemText: {
    fontSize: 14,
  },
}));
