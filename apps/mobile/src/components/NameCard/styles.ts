import { ThemedStyleSheet, Spacing } from '../../styles';

export default ThemedStyleSheet((theme) => ({
  card: {
    padding: Spacing.medium,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginVertical: Spacing.small,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  ownerText: {
    color: theme.colors.text,
    marginTop: Spacing.small,
  },
  expiryText: {
    color: theme.colors.text,
    marginTop: Spacing.xsmall,
  }
})); 