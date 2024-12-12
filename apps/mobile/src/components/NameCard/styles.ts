import {ThemedStyleSheet, Spacing} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: Spacing.xlarge,
    marginVertical: Spacing.medium,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },

  innerContainer: {
    backgroundColor: `${theme.colors.background}80`,
    borderRadius: 16,
    padding: Spacing.large,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },

  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: Spacing.medium,
    letterSpacing: 0.5,
  },

  detailsContainer: {
    marginTop: Spacing.medium,
    gap: Spacing.small,
  },

  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },

  label: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },

  value: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
  },

  expiryContainer: {
    marginTop: Spacing.medium,
    backgroundColor: `${theme.colors.primary}10`,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
}));
