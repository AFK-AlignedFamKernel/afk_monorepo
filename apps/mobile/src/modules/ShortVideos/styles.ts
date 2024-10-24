import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: theme.colors.background,
  },
  list: {
    height: '100%',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  noDataText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
}));
