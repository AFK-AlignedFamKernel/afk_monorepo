import {Dimensions} from 'react-native';
import {ThemedStyleSheet} from '../../../../styles';

export default ThemedStyleSheet((theme) => ({
  mint: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
    maxWidth: '100%',
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
  mintContentContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  unitsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },
  unit: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    color: theme.colors.text,
  },
  mintActionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    height: '100%',
    alignItems: 'center',
  },
  tabContentContainer: {
    padding: 10,
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
  newMintError: {
    marginTop: 5,
    color: theme.colors.errorDark,
    fontWeight: 'bold',
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
  mintInfoModalMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mintInfoModalContent: {
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
    position: 'relative',
    paddingVertical: 30,
    paddingHorizontal: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mintInfoModalText: {
    color: theme.colors.text,
    textAlign: 'center',
  },
  mintInfoModalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 25,
    marginBottom: 20,
  },
  mintInfoModalDescription: {
    fontSize: 12,
  },
  mintInfoModalVersion: {
    fontSize: 10,
  },
  mintInfoModalNuts: {
    fontSize: 10,
  },
}));
