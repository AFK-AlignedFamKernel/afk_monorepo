import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {},
  sidebarDesktop: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.bg,
    padding: 40,
    color: theme.colors.textPrimary,
  },
  sidebarMobile: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.bg,
    padding: 28,
    color: theme.colors.textPrimary,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  colContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 48,
    gap: 8,
  },
  logoDesktop: {
    width: 50,
    height: 50,
  },
  logoMobile: {
    width: 32,
    height: 32,
  },
  sidebarTextDesktop: {
    fontSize: 25,
    color: theme.colors.textPrimary,
    fontWeight: 500,
  },
  sidebarTextMobile: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: 500,
  },
  sidebarItemsContainer: {
    flexDirection: 'column',
    gap: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  itemDesktop: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    gap: 20,
    color: theme.colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  itemMobile: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
    gap: 10,
    color: theme.colors.textPrimary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  activeItem: {
    backgroundColor: theme.colors.primary
  },
  inactiveItem: {
    backgroundColor: theme.colors.bg
  },
  textItemDesktop: {
    color: theme.colors.textPrimary,
    fontSize: 16
  },
  textItemMobile: {
    color: theme.colors.textPrimary,
    fontSize: 14
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
