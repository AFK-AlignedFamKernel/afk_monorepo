import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    padding: Spacing.normal,
    width: '100%',
  },
  form: {
    gap: Spacing.normal,
  },
  inputContainer: {
    marginBottom: Spacing.small,
  },
  label: {
    marginBottom: Spacing.xsmall,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  error: {
    color: theme.colors.errorDark,
    fontSize: 12,
    marginTop: Spacing.xxsmall,
  },
  dexSelector: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    marginBottom: Spacing.normal,
  },
  dexButton: {
    flex: 1,
    padding: Spacing.small,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.surface,
  },
  dexButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dexButtonText: {
    textAlign: 'center',
    color: theme.colors.text,
  },
  dexButtonTextActive: {
    color: theme.colors.white,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
  },
}));
