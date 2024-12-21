import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainerDesktop: {
    width: 800,
    marginHorizontal: 'auto',
  },
  contentContainerMobile: {
    width: '100%'
  },
  form: {
    gap: Spacing.small,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.pagePadding,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5
  },
  inputLabel: {
    color: theme.colors.textPrimary,
    textAlign: 'left',
    width: '100%',
    fontSize: 14,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: theme.colors.grayInput,
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    borderColor: theme.colors.grayInput,
    borderWidth: 1
  },
  inputInfo: {
    color: theme.colors.grayInput,
    textAlign: 'right',
    width: '100%',
    fontSize: 12,
  },

  gap: {
    height: Spacing.medium,
  },
  publicKeyInput: {
    color: theme.colors.primary,
  },
}));
