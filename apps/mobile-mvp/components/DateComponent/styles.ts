import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  main_container: {
    width: '100%',
    flexDirection: 'row',
    gap: 20,
    display: 'flex',
  },
  main_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    marginHorizontal: 2,
  },
  picker: {
    height: 30,
    borderRadius: 8,
    borderColor: theme.colors.streamStudio_inputBorder,
    borderWidth: 1,
  },
  timeContainer: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  timeColon: {
    fontSize: 18,
    marginHorizontal: 2,
    fontWeight: '600',
  },
}));
