import {NotificationData} from './types';

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: NotificationData,
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
