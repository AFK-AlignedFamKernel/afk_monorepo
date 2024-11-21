import {ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  canvas_container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stream_container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  canvasContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  cursorMove: {
    cursor: 'pointer',
  },
  streamingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: -20,
    left: 16,
    right: 16,
    zIndex: 999,
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
