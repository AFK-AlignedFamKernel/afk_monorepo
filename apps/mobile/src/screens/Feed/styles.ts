import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  flatListContent: {
    marginTop: 10,
    paddingHorizontal: 25,
  },

  createPostButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
    // backgroundColor:theme.colors.primary,
    color: theme.colors.primary,
  },

  stories: {
    paddingHorizontal: 25,
  },

  storiesContainer: {
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.pagePadding,
  },
  storySeparator: {
    width: Spacing.medium,
  },
  activeToggle: {
    borderBottomWidth: 3,
    padding: 2,
    borderBottomColor: theme.colors.primary,
    // color: theme.colors.primary,
    textColor: theme.colors.primary,
  },
  activeIcon: {
    color: theme.colors.primary,
    textColor: theme.colors.primary,
    // backgroundColor: theme.colors.primary,
  },
  toggleButton: {
    width: 'auto',
    backgroundColor: theme.colors.background,
    padding: 2,
    borderRadius: 0,
    height: 'auto',
    display:"flex",
    flexDirection:"row",
    alignItems:"flex-end",
    justifyContent:"space-between",
    gap:10,
    
  },
  toggleButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'semibold',
  },

  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    // marginBottom: Spacing.small,
    height: '100%',
    maxHeight: 50,
    minHeight: 30,
    marginLeft: 20
  },


  // stories: {
  //   flex: 1,
  //   height:"100%",
  //   paddingVertical: Spacing.large,
  //   paddingHorizontal: Spacing.pagePadding,
  // },
}));
