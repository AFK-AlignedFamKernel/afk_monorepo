import {ThemedStyleSheet} from '../../../styles';
export default ThemedStyleSheet((theme) => ({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
}));
