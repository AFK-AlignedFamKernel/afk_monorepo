import { Platform } from "react-native";

export const setupWebNotifications = async () => {
  if (Platform.OS !== 'web') return;
  
  if (!('Notification' in window)) return;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}; 