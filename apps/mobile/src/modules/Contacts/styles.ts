import {Dimensions} from 'react-native';
import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: theme.colors.messageCard,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.messageCard,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.messageCard,
  },
  closeButtonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  profileInfo: {
    marginVertical: 16,
  },
  profileDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.colors.messageCard,
  },
  contactInfo: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: theme.colors.red,
    padding: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: theme.colors.white,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginVertical: 8,
  },
}));
