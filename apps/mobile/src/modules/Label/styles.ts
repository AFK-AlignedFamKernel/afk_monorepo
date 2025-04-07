import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    // position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  containerLabel: {
    flex: 1,
    backgroundColor: theme.colors.background,
    maxHeight: 250,
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  flatListContentLabel: {
    marginTop: 10,
    paddingHorizontal: 25,
    scrollbarWidth: "none",
    scrollbarHeight: "none",
    height: '100%',
    maxHeight: 250,
  },

  flatListContent: {
    marginTop: 10,
    paddingHorizontal: 25,
    scrollbarWidth: "none",
    scrollbarHeight: "none",
    height: '100%',
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
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },

  // stories: {
  //   flex: 1,
  //   height:"100%",
  //   paddingVertical: Spacing.large,
  //   paddingHorizontal: Spacing.pagePadding,
  // },
}));
