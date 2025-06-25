import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
    padding: 20,
    gap: 1,
    color: theme.colors.text,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.sidebarDivider,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  activeTab: {
    backgroundColor: theme.colors.divider,
  },
  tabText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  content: {
    color: theme.colors.text,
    padding: Spacing.medium,
  },
  itemContainer: {
    maxWidth: 170,
  },
  itemText: {
    color: theme.colors.text,
    marginBottom: Spacing.small,
  },
  itemSeparator: {
    width: Spacing.medium,
  },
}));
