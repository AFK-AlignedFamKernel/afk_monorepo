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
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  noDataText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
}));
