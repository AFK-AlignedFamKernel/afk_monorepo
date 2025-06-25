import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme, error: boolean, left: boolean, right: boolean) => ({
  container: {
    width: '100%',
    maxWidth: 500,
    padding: Spacing.medium,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    backgroundColor: theme.colors.transparent,
    height: 56,
    marginBottom: Spacing.medium,

    ...(error && {
      backgroundColor: theme.colors.errorLight,
      borderColor: theme.colors.errorDark,
    }),

    ...(left && {
      paddingLeft: Spacing.small,
    }),

    ...(right && {
      paddingRight: Spacing.small,
    }),
  },

  input: {
    borderWidth: 1,
    borderRadius: 999,
    borderColor: theme.colors.inputBorder,
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
    color: theme.colors.inputText,
    backgroundColor: theme.colors.inputBackground,
    fontSize: 15,
    ...Typography.semiBold,

    ...(left && {
      paddingLeft: Spacing.none,
    }),

    ...(right && {
      paddingRight: Spacing.none,
    }),
  },

  errorText: {
    marginTop: 3,
    color: theme.colors.errorDark,
  },
}));
