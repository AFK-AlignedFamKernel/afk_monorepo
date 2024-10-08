import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: Spacing.pagePadding,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: theme.colors.divider,
  },
  flatListContent: {
    paddingHorizontal: Spacing.pagePadding,
    paddingVertical: Spacing.medium,
  },
  cancelButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.xsmall,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    margin: Spacing.pagePadding,
    // color: theme.colors.text,
  },
  overview: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // color: theme.colors.text,
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
  },

  buttonIndicator: {
    marginRight: Spacing.xsmall,
  },
  holdersTotal: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    marginBottom: 10,

    heading: {
      fontSize: 30,
    },
  },
}));
