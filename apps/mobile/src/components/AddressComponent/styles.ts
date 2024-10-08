import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    marginRight: 10,
    fontSize: 13,
    color: theme.colors.text,
  },
}));
