import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },

  groupName: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 12,
    color: theme.colors.text,
  },

  memberList: {
    paddingTop: 5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 2,
  },
  memberActionButton: {
    padding: 8,
  },
  iconButton: {
    backgroundColor: theme.colors.buttonDisabledBackground,
    padding: Spacing.small,
  },
  addMemberButton: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.pagePadding,
  },

  //Menu
  menuContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  actionText: {
    marginLeft: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  deleteText: {
    color: theme.colors.red,
  },
}));
