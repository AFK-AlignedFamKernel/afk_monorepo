import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 0.3,
    borderColor: theme.colors.cardBorder,
  },
  hashtagColor: {
    color: theme.colors.primary,
  },
}));
