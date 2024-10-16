import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  createPostButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
    color: theme.colors.primary,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flatListContent: {
    marginTop: 20,
    paddingBottom: 80,
  },
  stories: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  storySeparator: {
    width: 8,
  },

  headerContainer: {
    marginBottom: 20,
    padding: 10,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  hashtagText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  noteCount: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 14,
  },
}));
