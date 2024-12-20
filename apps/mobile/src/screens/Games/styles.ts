// import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 30,
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grayInput,
    backgroundColor: theme.colors.greenBg,
    padding: 20,
    maxWidth: 400,
    aspectRatio: '1',
    flexBasis: '45%',
    cursor: 'pointer',
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  selectedContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  viewContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: Spacing.pagePadding,
    marginBottom: Spacing.pagePadding,
    // color: theme.colors.text,
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
  text: {
    color: theme.colors.text,
  },
}));
