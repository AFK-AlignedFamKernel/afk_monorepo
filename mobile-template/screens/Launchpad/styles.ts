import { Spacing, ThemedStyleSheet } from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  createTokenButton: {
    width: 200,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    margin: 20,
  },
  createTokenButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  flatListContent: {
    paddingVertical: Spacing.large,
    gap: Spacing.medium
  },
  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    // marginBottom: Spacing.small,
    height: '100%',
    maxHeight: 50,
    minHeight: 35,
    marginLeft: 20
  },
  activeToggle: {
    borderBottomWidth: 3,
    padding: 2,
    borderBottomColor: theme.colors.primary,
  },
  toggleButton: {
    width: 'auto',
    backgroundColor: theme.colors.background,
    padding: 2,
    borderRadius: 0,
    maxHeight: 45,
  },
  toggleButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'semibold',
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
  filterContainer: {
    flexDirection: 'row',
    display: "flex",
    flex: 1,
    padding: 10,
    margin: 10,
    gap: 10,
    height: "100%",
    maxHeight: 55,
    alignItems: 'flex-start',
    overflowX: "scroll",
    overflowY: "hidden",
    overflow: "hidden",
    scrollbarWidth: "none",
    scrollbarHeight: "none",
    // justifyContent:"space-between",
    // alignItems:"center",
    // gap: Spacing.small,
    // alignItems: 'center',
  },
  filterButton: {
    padding: Spacing.small,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    // margin: 10,
    gap: 10
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterAccordion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },

  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    justifyItems: 'center',

  },

  desktopFilterContent: {
    padding: 10,
  },
  mobileFilterContent: {
    padding: 4
  },

  filterOptions: {
    flexDirection: 'row',
    gap: Spacing.small,
    alignItems: 'center',
  },
  filterOption: {
    padding: Spacing.small,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    // borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  activeFilter: {
    // backgroundColor: theme.colors.primary,
    // color: theme.colors.primary,
    // // borderColor: theme.colors.primary,
    // textColor: theme.colors.primary,
  },
  activeFilterText: {
    // backgroundColor: theme.colors.primary,
    color: theme.colors.primary,
    borderColor: theme.colors.primary,
    textColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },

  createPostButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
    // backgroundColor:theme.colors.primary,
    color: theme.colors.primary,
  },
}));
