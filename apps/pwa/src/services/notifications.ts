
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  }
}

export async function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful');
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
} 