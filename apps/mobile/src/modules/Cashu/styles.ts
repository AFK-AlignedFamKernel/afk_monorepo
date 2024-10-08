import {Platform, StatusBar} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';
import {transform} from '@babel/core';

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
    backgroundColor: theme.colors.surface,
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
    fontWeight: 'bold',
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

  banner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: `1px solid ${theme.colors.divider}`,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    gap: 12,
    padding: 12,
  },
  bannerText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    maxWidth: '40%',
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
  },
  qrButton: {
    backgroundColor: 'transparent',
  },
  moreButton: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  moreButtonIcon: {
    transform: 'rotate(270deg)',
    marginLeft: 10,
  },
  lessButtonIcon: {
    transform: 'rotate(90deg)',
    marginLeft: 10,
  },
  balanceContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  balanceTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: theme.colors.text,
  },
  balance: {
    fontSize: 40,
    fontWeight: 900,
    color: theme.colors.primary,
  },
  activeMintText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  tabsContainer: {
    justifyContent: 'center',
    maxWidth: '100%',
  },
  tabs: {
    backgroundColor: 'transparent',
    color: theme.colors.text,
    borderRadius: 0,
    width: '30%',
  },
  active: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
  tabContentContainer: {
    padding: 20,
  },
  tabTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
    color: theme.colors.text,
  },
  titleMargin: {
    marginTop: 20,
  },
  tabSubtitle: {
    fontSize: 12,
    color: theme.colors.text,
  },
  mint: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
    maxWidth: '100%',
  },
  mintContentContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  textsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  title: {
    fontSize: 12,
    color: theme.colors.text,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  mintActionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'flex-end',
    height: '100%',
    alignItems: 'center',
  },
  addMintInput: {
    borderWidth: 1,
    borderRadius: 999,
    borderColor: theme.colors.inputBorder,
    flex: 1,
    height: '100%',
    color: theme.colors.inputText,
    backgroundColor: theme.colors.inputBackground,
    fontSize: 12,
    marginTop: 10,
    padding: 8,
  },
  qrButtonSmall: {
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  addMintBtn: {
    marginTop: 15,
    backgroundColor: theme.colors.primary,
    padding: 10,
  },
  addMintBtnText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  newMintError: {
    marginTop: 5,
    color: theme.colors.errorDark,
    fontWeight: 'bold',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  noDataText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
}));
