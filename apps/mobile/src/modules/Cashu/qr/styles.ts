import {Dimensions, StyleSheet} from 'react-native';

import {ThemedStyleSheet} from '../../../styles';

const {width} = Dimensions.get('window');

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraContainer: {
    width: width * 0.8,
    height: width * 0.8,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  resultContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    width: width * 0.8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  cancelText: {
    color: 'red',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  actionButton: {
    maxWidth: '40%',
    backgroundColor: theme.colors.primary,
    height: 50,
    marginTop: 40,
  },
  actionButtonText: {
    color: theme.colors.white,
  },
}));
