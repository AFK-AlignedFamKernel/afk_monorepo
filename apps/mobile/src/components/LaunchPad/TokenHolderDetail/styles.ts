import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.normal,
    borderRadius: 16,
    marginBottom: Spacing.small,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  holderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: theme.colors.messageCard,
    padding: Spacing.small,
    borderRadius: 8,
    marginTop: Spacing.xsmall,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}));
