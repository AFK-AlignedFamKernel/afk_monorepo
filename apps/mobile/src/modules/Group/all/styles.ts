import {ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  //Start of All Group Styling
  groupContainers: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  listContent: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    borderColor: theme.colors.divider,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    color: theme.colors.text,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupType: {
    color: theme.colors.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTypeText: {
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  viewButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  //End of All Group Styling
}));
