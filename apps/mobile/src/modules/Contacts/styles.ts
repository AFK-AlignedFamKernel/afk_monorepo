import {Dimensions} from 'react-native';

import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  addContactMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addContactContent: {
    width: "100%",
    // width: Dimensions.get('window').width * 0.85,
    // maxHeight: Dimensions.get('window').height * 0.8,
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
  addContactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  addContactForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    paddingHorizontal: 20,
  },
  addContactFormInput: {
    backgroundColor: theme.colors.messageCard,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  formButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  formActionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginTop: 20,
  },
  formCancelButton: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.divider,
  },
  formCancelButtonText: {
    color: theme.colors.errorDark,
  },
  formAddButton: {
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
    color:theme.colors.text,
  },
  formAddButtonText: {
    color: theme.colors.primary,
  },
  checkAddressButton: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderColor: theme.colors.text,
    paddingBottom: 2,
    width: 125,
    marginHorizontal: 'auto',
    marginVertical: 0,
    paddingHorizontal: 5,
  },
  checkAddressButtonText: {
    color: theme.colors.text,
  },
  hideInfoButton: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderColor: theme.colors.text,
    paddingBottom: 2,
    width: 130,
    marginHorizontal: 'auto',
    marginVertical: 0,
    paddingHorizontal: 5,
  },
  hideInfoButtonText: {
    color: theme.colors.text,
  },
  profileInfo: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  contactItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: Spacing.xsmall,
    marginBottom: Spacing.small,
    height: '100%',
    maxHeight: 100,
  },
  
  toggleButton: {
    width: 'auto',
    backgroundColor: theme.colors.background,
    padding: 2,
    borderRadius: 0,
    height: 'auto',
  },
}));
