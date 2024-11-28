import {StyleSheet} from 'react-native';

export default {
  container: {
    padding: 16,
    width: '100%',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  dexSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dexButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dexButtonActive: {
    backgroundColor: '#007AFF',
  },
  dexButtonText: {
    textAlign: 'center',
  },
  dexButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  }
} as const; 