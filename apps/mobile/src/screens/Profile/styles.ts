import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  optionsContentContainer: {
    paddingVertical: 5,
    paddingHorizontal:5,
    flexDirection: 'row',
    rowGap: 3,
    gap: 3,
    columnGap: 15,
  },
  optionsContainer: {
    paddingHorizontal:5,
    paddingVertical: 5,
    flexDirection: 'row',
    rowGap: 3,
    gap: 3,
    columnGap: 3
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.primary,
    borderRadius: 20,
    color: theme.colors.textLight,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text
  }
}));
