import {SessionAccountInterface} from '@argent/tma-wallet';
import {Button} from '@chakra-ui/react';
import {useEffect, useState} from 'react';

import {useArgentTMA} from '@/hooks/useArgent';

export const TelegramAccount = () => {
  const argentTMA = useArgentTMA();
  const [accountTg, setAccount] = useState<SessionAccountInterface | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Call connect() as soon as the app is loaded
    argentTMA
      ?.connect()
      .then((res) => {
        if (!res) {
          // Not connected
          setIsConnected(false);
          return;
        }

        if (accountTg?.getSessionStatus() !== 'VALID') {
          // Session has expired or scope (allowed methods) has changed
          // A new connection request should be triggered

          // The account object is still available to get access to user's address
          // but transactions can't be executed
          const {account} = res;

          setAccount(account);
          setIsConnected(false);
          return;
        }

        // Connected
        const {account, callbackData} = res;
        // The session account is returned and can be used to submit transactions
        setAccount(account);
        setIsConnected(true);
        // Custom data passed to the requestConnection() method is available here
        console.log('callback data:', callbackData);
      })
      .catch((err) => {
        console.error('Failed to connect', err);
      });
  }, []);

  const handleConnectButton = async () => {
    // If not connected, trigger a connection request
    // It will open the wallet and ask the user to approve the connection
    // The wallet will redirect back to the app and the account will be available
    // from the connect() method -- see above
    await argentTMA?.requestConnection('custom_callback_data');
  };

  // useful for debugging
  const handleClearSessionButton = async () => {
    await argentTMA?.clearSession();
    setAccount(undefined);
  };

  return (
    <>
      <div>
        {!isConnected && <Button onClick={handleConnectButton}>Connect</Button>}

        {isConnected && (
          <>
            <p>
              Account address: <code>{accountTg?.address}</code>
            </p>
            <Button onClick={handleClearSessionButton}>Clear Session</Button>
          </>
        )}
      </div>
    </>
  );
};
