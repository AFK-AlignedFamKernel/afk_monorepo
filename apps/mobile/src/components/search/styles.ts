import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0',
    background: theme.colors.background,
    color: theme.colors.text,
    borderRadius: 20,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    background: theme.colors.background,
    borderColor: theme.colors.background,

    color: theme.colors.text,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
}));
