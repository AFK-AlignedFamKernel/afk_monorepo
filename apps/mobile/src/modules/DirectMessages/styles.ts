import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  messageNewUserButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    marginBottom: Spacing.small,
    height: '100%',
    maxHeight: 100,
  },
  toggleButton: {
    width: 'auto',
    backgroundColor: theme.colors.background,
    padding: 2,
    borderRadius: 0,
  },
}));
