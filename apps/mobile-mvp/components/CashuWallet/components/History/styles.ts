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
  txDirectionColumn: {
    width: '10%',
  },
  txAmountColumn: {
    width: '40%',
    alignItems: 'flex-end',
  },
  dirText: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dirOutText: {
    color: theme.colors.errorDark,
  },
  dirInText: {
    color: theme.colors.primary,
  },
  tableHeading: {
    fontWeight: 'bold',
    fontSize: 14,
    color: theme.colors.text,
  },
  txActionsColumn: {
    width: '50%',
    justifyContent: 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  txListContainer: {
    display: 'flex',
  },
  txContainer: {
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  amountText: {
    color: theme.colors.text,
  },
  txActionButton: {
    backgroundColor: 'transparent',
  },
  txModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  txModalContent: {
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
  txModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.primary,
    paddingBottom: 10,
  },
  txModalTextAmount: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  txModalTextTime: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  txModalTextState: {
    fontWeight: 'bold',
    color: theme.colors.errorDark,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  txModalActionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  txModalActionButton: {
    backgroundColor: 'transparent',
    paddingBottom: 0,
  },
  txModalActionButtonText: {
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
