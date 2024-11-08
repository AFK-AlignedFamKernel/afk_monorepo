import {Spacing, ThemedStyleSheet} from '../../styles';
export default ThemedStyleSheet((theme) => ({
  container: {
    width: '100%',
  },
  tradingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: Spacing.normal,
    gap: Spacing.small,
  },
  tokenInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  tokenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  tokenPrice: {
    fontSize: 18,
    color: theme.colors.text,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    marginBottom: Spacing.small,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: theme.colors.primary,
  },
  inputContainer: {
    gap: Spacing.xsmall,
  },
  input: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: theme.colors.textSecondary,
  },
  maxButton: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xxsmall,
    backgroundColor: theme.colors.secondary,
  },
  actionButton: {
    width: '100%',
    marginTop: Spacing.small,
    backgroundColor: theme.colors.primary,
  },
}));
