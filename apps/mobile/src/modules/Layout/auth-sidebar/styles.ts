import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    marginVertical: 10,
    color: theme.colors.text,
  },
  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
    padding: 10,
    gap: 1,
    // borderRight:"1"
  },
  sidebarText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  item: {
    display: 'flex',
    width: '100%',
    height: 100,
    backgroundColor: theme.colors.background,
    // flex
    // flex: 1,
    flexDirection: 'row',
    // paddingVertical: 8,
    color: theme.colors.text,
  },
  textItem: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  outsideContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  outside: {
    width: '100%',
    height: '100%',
  },

  menuContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  menu: {
    position: 'absolute',
    height: 'auto',
    backgroundColor: theme.colors.divider,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },

  menuItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxsmall,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.text,
  },
}));
