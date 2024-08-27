import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: Spacing.medium,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: Spacing.small,
    color: theme.colors.text,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  actionButton: {
    backgroundColor: theme.colors.buttonDisabledBackground,
    padding: Spacing.small,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  actionButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: theme.colors.red,
  },
  iconButton: {
    backgroundColor: theme.colors.buttonDisabledBackground,
    padding: Spacing.small,
  },
  switchTrack: {
    backgroundColor: theme.colors.divider,
  },
  switchTrackActive: {
    backgroundColor: theme.colors.buttonDisabledBackground,
  },
  switchThumb: {
    backgroundColor: theme.colors.background,
  },
  switchThumbActive: {
    backgroundColor: theme.colors.buttonDisabledBackground,
  },
}));
