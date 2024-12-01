import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
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
    color: theme.colors.text,
    margin: Spacing.pagePadding,
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    gap: 15,
  },
  title: {
    color: theme.colors.text,
    ...Typography.bold,
    fontSize: 20,
  },
  warningContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 20,
  },
  warning: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
  },
  receiveButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 10,
  },
  receiveButtonText: {
    color: theme.colors.white,
  },
}));
