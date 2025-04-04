import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: Spacing.pagePadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  cancelButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.xsmall,
  },

  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  form: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: Spacing.large,
    color: theme.colors.inputText,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
    ...Typography.medium,
  },
  imageContainer: {
    padding: Spacing.pagePadding,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
    overflow: 'hidden',
  },

  buttons: {
    position: 'relative',
  },
  mediaButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.pagePadding,
    paddingVertical: Spacing.small,
    gap: Spacing.large,
    alignItems: 'center',
  },
  sendButton: {
    position: 'absolute',
    right: Spacing.pagePadding,
    bottom: '110%',
  },

  videoContainer: {
    padding: 10,
    overflow: 'hidden',
    width: '100%',
    height: 400,
  },
  
  // User Search Styles
  userSearchContainer: {
    position: 'absolute',
    top: 150, // Adjust based on your layout
    left: Spacing.pagePadding,
    right: Spacing.pagePadding,
    maxHeight: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  userSearchList: {
    maxHeight: 200,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.small,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.small,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  userPubkey: {
    ...Typography.regular,
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  
  // Emoji Picker Styles
  emojiButton: {
    fontSize: 24,
    paddingHorizontal: 4,
  },
  markdownButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  emojiPickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  emojiPickerTitle: {
    ...Typography.medium,
    fontSize: 16,
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 22,
    color: theme.colors.text,
    padding: 4,
  },
  emojiGrid: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.medium,
    maxHeight: 300,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.medium,
  },
  emojiItem: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
}));
