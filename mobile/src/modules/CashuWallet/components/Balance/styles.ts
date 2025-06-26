import {ThemedStyleSheet} from '../../../../styles';

export default ThemedStyleSheet((theme) => ({
  balanceContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  balanceTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: theme.colors.text,
  },
  balance: {
    fontSize: 40,
    fontWeight: 900,
    color: theme.colors.primary,
  },
  currencyButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.text,
  },
  currencyButtonText: {
    color: theme.colors.text,
  },
  activeMintText: {
    fontSize: 12,
    color: theme.colors.text,
  },
}));
