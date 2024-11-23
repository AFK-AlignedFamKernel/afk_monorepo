import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },

  flatListContent: {
    // paddingHorizontal: Spacing.pagePadding,
    paddingVertical: Spacing.medium,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    marginBottom: Spacing.small,
  },
  activeToggle: {
    backgroundColor: theme.colors.primary,
    color:theme.colors.badge,
    border:theme.colors.badgeBorder
  },
  toggleButton: {
    flex: 1,
    borderRadius: 8,
  },
  separator: {
    height: Spacing.xsmall,
  },

  tip: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.xsmall,
    borderRadius: 8,
    gap: Spacing.xsmall,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  token: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xsmall,
  },

  senderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  sender: {
    flex: 1,
  },

  text: {
    color: theme.colors.text,
    fontSize: 12,
    backgroundColor: theme.colors.background,
  },

  buttonIndicator: {
    marginRight: Spacing.xsmall,
  },
}));
