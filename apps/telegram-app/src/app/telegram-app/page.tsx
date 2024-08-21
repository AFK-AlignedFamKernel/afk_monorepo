'use client';
import {useEffect} from 'react';

const TelegramWebAppPage = () => {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    console.log('tg', tg);

    if (tg) {
      // Expanding the web app to full height
      tg.expand();

      // Setting up the main button
      tg.MainButton.text = 'Send Data to Bot';
      tg.MainButton.show();

      tg.MainButton.onClick(() => {
        tg.sendData('Some data'); // Sends data to the bot
      });

      console.log(tg.initDataUnsafe); // Example of using initData
    }
  }, []);

  return (
    <div>
      <h1>Welcome to the Telegram Web App</h1>
      <p>Interact with the app using the Telegram Web App API.</p>
    </div>
  );
};

export default TelegramWebAppPage;
