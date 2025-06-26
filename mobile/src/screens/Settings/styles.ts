import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: Spacing.pagePadding,
    color: theme.colors.text,
    gap: 3,
    overflow: 'scroll',
  },
  toggleThemeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeButton: {
    width: Spacing.xxlarge,
    height: Spacing.xxlarge,
    borderRadius: Spacing.normal,
    padding: 0,
    paddingInline: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    position: 'relative',
    top: 6,
    left: 4,
  },
  content: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: Spacing.medium,
  },

  backButton: {
    position: 'absolute',
    top: Spacing.pagePadding,
    left: Spacing.pagePadding,
  },

  title: {
    color: theme.colors.text,
    fontSize: 24,
    marginBottom: 4,
  },
  text: {
    color: theme.colors.text,
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xsmall,
    paddingTop: Spacing.xsmall,
  },
}));
