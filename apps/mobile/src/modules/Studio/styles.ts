import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  streamContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surface,
  },
  mainVideoStream: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  controlButton: {
    color: '#fff',
    fontSize: 16,
    padding: 4,
    cursor: 'pointer',
  },
  pipContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 180,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: '#000',
    transition: 'all 0.3s ease',
    zIndex: 10,
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 8px 12px rgba(0, 0, 0, 0.2)',
    },
  },
  pipVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 1,
  },
  videoStream: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    backgroundColor: theme.colors.errorDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  viewerContainer: {
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerCount: {
    color: theme.colors.textLight,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.swap_divider,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonDestructive: {
    backgroundColor: theme.colors.errorDark,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  iconButton: {
    padding: 2,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.buttonBackground,
    borderWidth: 1,
    borderColor: theme.colors.swap_divider,
  },

  // Chat section
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonText: {
    color: theme.colors.text,
  },

  //Share button
  share_button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  share_icon: {
    marginRight: 8,
  },
  share_buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
}));
