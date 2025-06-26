import {Dimensions} from 'react-native';

import {ThemedStyleSheet} from '../../../../styles';

export default ThemedStyleSheet((theme) => ({
  tabContentContainer: {
    padding: 10,
  },
  tabTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
    color: theme.colors.text,
  },
  tableHeadersContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: 15,
  },
  amountColumn: {
    width: '40%',
  },
  tableHeading: {
    fontWeight: 'bold',
    fontSize: 14,
    color: theme.colors.text,
  },
  actionsColumn: {
    width: '60%',
    justifyContent: 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  invoicesListContainer: {
    display: 'flex',
  },
  invoiceContainer: {
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  amountText: {
    color: theme.colors.text,
  },
  invoicesActionButton: {
    backgroundColor: 'transparent',
  },
  invoiceModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  invoiceModalContent: {
    width: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.8,
    maxWidth: 400,
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
    padding: 20,
  },
  invoiceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.primary,
    paddingBottom: 10,
  },
  invoiceModalTextAmount: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  invoiceModalTextTime: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  invoiceModalTextState: {
    fontWeight: 'bold',
    color: theme.colors.errorDark,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  invoiceModalActionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  invoiceModalActionButton: {
    backgroundColor: 'transparent',
    paddingBottom: 0,
  },
  invoiceModalActionButtonText: {
    color: theme.colors.text,
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
