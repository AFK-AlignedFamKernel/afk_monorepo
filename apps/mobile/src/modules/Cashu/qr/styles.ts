import {Dimensions} from 'react-native';

import {ThemedStyleSheet} from '../../../styles';

const {width} = Dimensions.get('window');

export default ThemedStyleSheet((theme) => ({
  grantPermissionMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  grantPermissionContent: {
    width: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  grantPermissionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  grantModalButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  grantActionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginTop: 20,
  },
  grantCancelButton: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.divider,
  },
  grantCancelButtonText: {
    color: theme.colors.errorDark,
  },
  grantAcceptButton: {
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
  },
  grantAcceptButtonText: {
    color: theme.colors.primary,
  },
  modalActionButton: {
    backgroundColor: theme.colors.primary,
    maxWidth: 200,
    marginHorizontal: 'auto',
    marginBottom: 20,
  },
  modalActionButtonText: {
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 20,
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
    maxWidth: 400,
    maxHeight: 400,
  },
  camera: {
    flex: 1,
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
