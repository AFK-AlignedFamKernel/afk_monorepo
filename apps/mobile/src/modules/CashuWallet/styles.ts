import {Platform, StatusBar} from 'react-native';

import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    width: '100%',
    padding: Spacing.medium,
    borderRadius: 10,
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'relative',
    alignItems: 'center',
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  settingsButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    height: '95%',
    overflow: 'scroll',
    backgroundColor: 'transparent',
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
  orText: {
    textAlign: 'center',
    marginVertical: Spacing.small,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  qrButton: {
    backgroundColor: 'transparent',
    marginTop: Spacing.small,
    marginBottom: Spacing.small,
  },
  moreButton: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  moreButtonText: {
    color: theme.colors.text,
  },
  moreButtonIcon: {
    transform: 'rotate(270deg)',
    marginLeft: 10,
  },
  lessButtonIcon: {
    transform: 'rotate(90deg)',
    marginLeft: 10,
  },
  tabsContainer: {
    maxWidth: '100%',
  },
  tabs: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    width: '30%',
  },
  tabText: {
    color: theme.colors.text,
  },
  active: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
}));
