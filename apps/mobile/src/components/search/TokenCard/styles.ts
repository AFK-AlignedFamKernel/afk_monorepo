import {Dimensions, StyleSheet} from 'react-native';

import {Spacing} from '../../../styles';

export default (theme: any) =>
  StyleSheet.create({
    container: {
      // backgroundColor: '#1E1E1E',
      backgroundColor: theme.colors.cardBg,
      borderRadius: 16,
      padding: 20,
      margin: 8,
      borderWidth: 1,
      // borderColor: '#2A2A2A',
      flex: 1,
      maxWidth: '100%',
      justifyContent: 'space-evenly',
    },
    header: {
      flexDirection: 'column',
      gap: 8,
      marginBottom: 20,
    },
    tokenName: {
      fontSize: 14,
      // color: '#FFFFFF',
      color: theme.colors.text,
      fontWeight: 'bold',
      fontFamily: 'italic',
    },
    symbolName: {
      fontSize: 20,
      // color: '#FFFFFF',
      fontWeight: 'bold',
      color: theme.colors.text,
      // fontWeight: 'bold',
    },
    addressContainer: {
      backgroundColor: '#2A2A2A',
      padding: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceTag: {
      backgroundColor: '#2A2A2A',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
      marginVertical: 16,
    },
    statBox: {
      // backgroundColor: '#2A2A2A',
      padding: 12,
      borderRadius: 8,
      width: '48%',
    },
    statLabel: {
      color: '#808080',
      marginBottom: 4,
    },
    statValue: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      padding: Spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: Spacing.small,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: 18,
      // minWidth: 100,
      fontWeight:"bold",
      fontStyle:"italic"
    },
    value: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalContent: {
      backgroundColor: theme.colors.cardBg,
      padding: 20,
      borderRadius: 16,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    formGroup: {
      marginBottom: 20,
    },

    input: {
      backgroundColor: theme.colors.cardBg,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10, 
      borderWidth: 1,
      borderColor: theme.colors.border, 
      color: theme.colors.text,
      maxHeight: 100,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    cancelButton: {
      backgroundColor: theme.colors.primary,
      padding: Spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      padding: Spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
    },
    uploadButton: {
      backgroundColor: theme.colors.primary,
      padding: Spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
    },
    uploadButtonText: {
      color: '#FFFFFF',
    },
    mediaUpload: {
      marginBottom: 20,
    },
    mediaUploadText: {
      color: '#FFFFFF',
    },
    textArea: {
      height: 100,
    },
    mediaButtons: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.pagePadding,
      paddingVertical: Spacing.small,
      gap: Spacing.large,
      alignItems: 'center',
    },
    imageContainer: {
      padding: Spacing.pagePadding,
      width: Dimensions.get('window').width * 0.2,
      height: Dimensions.get('window').height * 0.2,
    },
    image: {
      width: '100%',
      resizeMode: 'cover',
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoContainer: {
      padding: Spacing.pagePadding,
    },
    text: {
      color: theme.colors.text,
      fontSize: 10,
      // fontWeight: '600',
    },
    textBig: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
