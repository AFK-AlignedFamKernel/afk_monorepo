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
    paddingVertical: Spacing.large,
  },

  createPostButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
  },

  stories: {
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.pagePadding,
  },

  storiesContainer: {
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.pagePadding,
  },
  storySeparator: {
    width: Spacing.medium,
  },

  // stories: {
  //   flex: 1,
  //   height:"100%",
  //   paddingVertical: Spacing.large,
  //   paddingHorizontal: Spacing.pagePadding,
  // },
}));
