import {Dimensions} from 'react-native';

import {Spacing, ThemedStyleSheet} from '../../styles';

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
    maxWidth: 450,
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
    position: 'relative',
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
  waitingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 200000,
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
  cameraWeb: {
    maxWidth: width * 0.8,
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
    fontSize: 20,
    marginVertical: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    color: theme.colors.text,
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
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
    color: theme.colors.text,
  },
  scannedModalButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  scannedModalActionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  scannedModalCancelButton: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.divider,
  },
  scannedModalCancelButtonText: {
    color: theme.colors.errorDark,
  },
  scannedModalOKButton: {
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
  },
  scannedModalOKButtonText: {
    color: theme.colors.primary,
  },
  toastContainer: {
    paddingTop: Spacing.pagePadding,
    paddingHorizontal: Spacing.pagePadding,
    gap: Spacing.xsmall,
    position: 'absolute',
    bottom: 10,
    zIndex: 10000,
  },
  waitingContainer:{
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  text: {
    fontSize: 16,
    color: theme.colors.text,
  },
  successText: {
    fontSize: 20,
    color: theme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',

  },
  
  successContainer:{
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.pagePadding,
    zIndex: 1000,
    borderRadius: 10,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
}));
