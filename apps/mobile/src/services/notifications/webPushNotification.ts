export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function subscribeToWebPush(): Promise<WebPushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.EXPO_PUBLIC_VAPID_KEY
    });

    return subscription.toJSON() as WebPushSubscription;
  } catch (error) {
    console.error('Failed to subscribe to web push:', error);
    return null;
  }
} 