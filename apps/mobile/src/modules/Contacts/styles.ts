import {Dimensions, StyleSheet} from 'react-native';

import {Theme} from '../../styles';

const {width} = Dimensions.get('window');

export default (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    contactInfo: {
      flex: 1,
      marginVertical: 15,
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    pubkey: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    menuContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    menuText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 15,
    },
    button: {
      backgroundColor: theme.colors.surface,
      padding: 10,
      borderRadius: 8,
      flex: 1,
    },
    buttonText: {
      color: theme.colors.text,
      textAlign: 'center',
    },
    input: {
      backgroundColor: '#000',
      borderRadius: 8,
      padding: 12,
      color: theme.colors.text,
      marginBottom: 15,
    },
    infoText: {
      color: theme.colors.textSecondary,
      marginBottom: 5,
    },
    actionButton: {
      backgroundColor: '#7C3AED', // Purple color from the screenshot
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    closeButton: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 5,
    },
    closeButtonText: {
      color: theme.colors.text,
    },
    contactsList: {
      maxHeight: 300, // Fixed height instead of percentage
      marginBottom: 15,
    },
    activeButton: {
      backgroundColor: '#7C3AED', // Purple color for active tab
    },
    activeButtonText: {
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialogContainer: {
      width: width * 0.9, // 90% of screen width
      maxHeight: '80%',
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
  });