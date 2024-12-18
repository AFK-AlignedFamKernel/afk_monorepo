import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  connectors: {
    marginVertical: Spacing.medium,
    gap: Spacing.small,
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: Spacing.small,
    borderRadius: 8,
    gap: Spacing.medium,
  },

  //Wallet Connect
  icon: {
    width: 44,
    height: 44,
    borderRadius: 5,
  },
  container: {
    flex: 1,
  },
  connectButton: {
    // backgroundColor: '#FF007A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallText: {
    color: '#989898',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    paddingTop: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  list: {
    marginVertical: 20,
    width: '100%',
  },
  connectorButton: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: theme.colors.divider,
    borderWidth: 1,
  },
  connectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectorText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  closeButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#212429',
    borderRadius: 12,
    marginBottom: 10,
  },
  closeButtonText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6871',
    marginTop: 20,
    textAlign: 'center',
  },
  connectedContainer: {
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 18,
    marginBottom: 8,
    color: theme.colors.text,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: theme.colors.errorDark,
    padding: 12,
    borderRadius: 16,
  },
  disconnectText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

  //Connected Wallet style
  connected_container: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    padding: 14,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4ADE80',
  },
  disconnected: {
    backgroundColor: '#F87171',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  disconnectButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: theme.colors.messageCard,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    color: theme.colors.text,
    fontSize: 12,
    marginBottom: 6,
  },
  infoValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  balanceText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 24,
  },
  symbolText: {
    color: '#BFDBFE',
    fontSize: 20,
  },
  connectButtonText: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 16,
  },

  //Signer
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: theme.colors.text,
  },

  messageContainer: {
    maxHeight: 200,
    marginVertical: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 5,
  },
  buttonContainer: {
    justifyContent: 'space-between',
    gap: 10,
  },
  signatureContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 5,
  },

  // login
  loginMethodsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 556,
    flexWrap: 'wrap'
  },
  loginMethodsContainerDesktop: {
    flexWrap: 'nowrap'
  },
  loginMethodBtn: {
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    maxWidth: '100%',
    backgroundColor: theme.colors.bg,
    flexGrow: 1
  },
  loginMethodBtnDesktop: {
    width: 270,
  },
  btnInnerContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  loginMethodBtnText: {
    color: theme.colors.primary,
    fontWeight: 500,
    height: '100%'
  },
  loginMethodBtnImg: {
    width: 20,
    height: 20
  },
  passwordLabel: {
    color: theme.colors.textPrimary,
    marginTop: 40,
    textAlign: 'left',
    width: '100%',
    maxWidth: 550,
    fontSize: 14,
    marginBottom: 10
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 556,
  },
  passwordInput: {
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 13,
    color: theme.colors.grayInput,
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    borderColor: theme.colors.grayInput,
    borderWidth: 1
  },
  passwordInstruction: {
    color: theme.colors.grayInput,
    textAlign: 'left',
    width: '100%',
    maxWidth: 550,
    fontSize: 12,
    marginTop: 5
  },
  eyeIcon: {
    position: 'absolute',
    top: 10,
    right: 16,
  },
  importAccountBtnContainer: {
    maxWidth: 556,
    width: '100%',
  },
  importAccountBtn: {
    width: 215,
    padding: 0,
    fontWeight: 500,
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 'auto',
    marginTop: 16,
    textAlign: 'right',
    cursor: 'pointer'
  },
  loginBtn: {
    maxWidth: 556,
    width: '100%',
    marginTop: 16
  },
  divider: {
    maxWidth: 556,
    width: '100%',
    marginTop: 40,
    marginBottom: 40,
  },
  noAccountBtnContainer: {
    maxWidth: 556,
    width: '100%',
  },
  noAccountBtn: {
    width: 215,
    padding: 0,
    fontWeight: 500,
    fontSize: 12,
    color: theme.colors.primary,
    marginRight: 'auto',
    marginVertical: 16,
    textAlign: 'left',
    cursor: 'pointer'
  },
}));
