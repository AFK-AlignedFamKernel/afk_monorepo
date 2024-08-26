import {ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    width: '100%',
    padding: 14,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cardContent: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },

  input: {
    color: theme.colors.inputText,
  },

  cardFooter: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}));
