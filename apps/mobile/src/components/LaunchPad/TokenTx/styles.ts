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
  txRow: {
    backgroundColor: theme.colors.messageCard,
    padding: Spacing.normal,
    borderRadius: 12,
    marginBottom: Spacing.small,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xsmall,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    flex: 1,
    marginLeft: Spacing.small,
  },
  txType: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  txTypeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  }
}));
