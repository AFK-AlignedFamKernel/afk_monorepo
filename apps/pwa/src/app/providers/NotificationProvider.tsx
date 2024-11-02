'use client';
import {createContext, useContext, useEffect} from 'react';
import {requestNotificationPermission, setupServiceWorker} from '../../services/notifications';

const NotificationContext = createContext({});

export function NotificationProvider({children}: {children: React.ReactNode}) {
  useEffect(() => {
    const initNotifications = async () => {
      const permission = await requestNotificationPermission();
      if (permission) {
        const registration = await setupServiceWorker();
        if (registration) {
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
            });
            console.log('Push notification subscription:', subscription);
          } catch (err) {
            console.error('Failed to subscribe to push notifications:', err);
          }
        }
      }
    };

    initNotifications();
  }, []);

  return <NotificationContext.Provider value={{}}>{children}</NotificationContext.Provider>;
} 