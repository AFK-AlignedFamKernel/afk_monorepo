import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  
  if (!Device.isDevice) return null;

  const {status: existingStatus} = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const {status} = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return null;
  
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token.data;
} 