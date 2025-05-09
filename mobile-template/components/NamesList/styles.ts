import {ThemedStyleSheet, Spacing} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: Spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  emptyText: {
    color: theme.colors.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.medium,
  },
}));
