import {Spacing, ThemedStyleSheet} from '../../../../styles';

export default ThemedStyleSheet((theme) => ({
  banner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: `1px solid ${theme.colors.divider}`,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    gap: 12,
    padding: 12,
  },
  bannerText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  bannerButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  orText: {
    textAlign: 'center',
    marginVertical: Spacing.small,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
}));
