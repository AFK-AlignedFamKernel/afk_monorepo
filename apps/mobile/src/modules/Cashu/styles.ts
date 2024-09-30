import {Platform, StatusBar} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  // container: {
  //   position: 'relative',
  //   flex: 1,
  //   backgroundColor: theme.colors.background,
  // },

  container: {
    // flex:1,
    width: '100%',
    // maxWidth: 500,
    padding: Spacing.medium,
    borderRadius: 10,
    // position: 'relative',
    flex: 1,
    // backgroundColor: theme.colors.background,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  activeTab: {
    backgroundColor: theme.colors.divider,
  },
  tabText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  tabSelector: {
    // flex:1,
    // maxWidth: 500,
    padding: Spacing.medium,
    borderRadius: 10,
    // position: 'relative',
    flex: 1,
    flexDirection: 'row',
    // backgroundColor: theme.colors.background,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
    height: '95%',
    // flexGrow: 1,
    // overflow:"scroll",
  },
  flatListContent: {
    paddingVertical: Spacing.large,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    color: theme.colors.text,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.medium,
    color: theme.colors.text,
  },
  content: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    backgroundColor: theme.colors.transparent,
    height: 56,
    marginBottom: Spacing.medium,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderRadius: 999,
    borderColor: theme.colors.inputBorder,
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
    color: theme.colors.inputText,
    backgroundColor: theme.colors.inputBackground,
    fontSize: 15,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: Spacing.medium,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: theme.colors.primary,
  },
  orText: {
    textAlign: 'center',
    marginVertical: Spacing.small,
    color: theme.colors.text,
  },
  text: {
    // textAlign: 'center',
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.large,
    marginTop: 'auto',
    borderRadius: 10,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.medium,
    color: theme.colors.text,
  },
  closeButton: {
    marginTop: Spacing.medium,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 3,
    color: theme.colors.errorDark,
  },

  //Wallet Info
  walletcontainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  infoSection: {
    marginBottom: Spacing.medium,
  },
  paymentSection: {
    marginBottom: Spacing.medium,
  },
  zapSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: Spacing.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  infoLabel: {
    ...Typography.regular,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    ...Typography.semiBold,
    color: theme.colors.text,
  },
  paymentRequest: {
    marginBottom: Spacing.small,
  },
  paymentRequestLabel: {
    ...Typography.regular,
    color: theme.colors.textSecondary,
    marginBottom: Spacing.xsmall,
  },
  paymentRequestValue: {
    ...Typography.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.messageCard,
    padding: Spacing.small,
    borderRadius: 5,
  },

  zapButton: {
    backgroundColor: theme.colors.secondary,
    padding: Spacing.medium,
    borderRadius: 999,
    alignItems: 'center',
    width: '100%',
  },

  paymentStatus: {
    ...Typography.regular,
    color: theme.colors.text,
    textAlign: 'center',
  },
}));
