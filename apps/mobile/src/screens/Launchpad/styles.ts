import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: 40,
  },
  createTokenButton: {
    width: 200,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  createTokenButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
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
    borderBottomWidth: 3,
    padding: 2,
    borderBottomColor: theme.colors.primary,
  },
  toggleButton: {
    width: 'auto',
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    fontWeight: 'semiBold',
    padding: 2,
    borderRadius: 0,
    height: 'auto'
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
