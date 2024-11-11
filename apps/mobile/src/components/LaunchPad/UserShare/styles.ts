import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.normal,
    borderRadius: 16,
    marginBottom: Spacing.small,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    paddingVertical: Spacing.small,
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
    padding: Spacing.normal,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.medium,
  },
  connectText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}));
