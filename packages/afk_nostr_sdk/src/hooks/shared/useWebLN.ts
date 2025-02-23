import {webln} from '@getalby/sdk';
import {useState, useEffect} from 'react';
import {useAuth} from '../../store';

export const useWebLN = () => {
  const {setNWCUrl: setNwcUrlStore} = useAuth();
  const [nostrWebLNState, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(undefined);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [balance, setBalance] = useState<number | undefined>();
  const [connectionData, setConnectionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webln) {
      setIsExtensionAvailable(true);
    }
  }, [window]);

  const fetchData = async () => {
    try {
      if (!nostrWebLNState) return;

      setIsLoading(true);
      await nostrWebLNState.enable();
      const response = await nostrWebLNState.getBalance();
      setBalance(response.balance);
      setConnectionStatus('connected');

      const info = await nostrWebLNState.getInfo();
      setConnectionData(info);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithAlby = async () => {
    try {
      setConnectionStatus('connecting');
      setIsLoading(true);

      if (isExtensionAvailable) {
        try {
          await (window as any)?.webln.enable();
          setNostrWebLN((window as any)?.webln);
          setConnectionStatus('connected');
          return (window as any)?.webln;
        } catch (error) {
          console.error('Failed to connect to Alby extension:', error);
        }
      } else {
        const nwc = webln.NostrWebLNProvider.withNewSecret();
        // Rest of your existing connectWithAlby logic
      }
    } catch (e) {
      console.log('Error connectWithAlby', e);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nostrWebLNState,
    setNostrWebLN,
    isExtensionAvailable,
    connectionStatus,
    setConnectionStatus,
    balance,
    setBalance,
    connectionData,
    setConnectionData,
    isLoading,
    connectWithAlby,
    fetchData,
  };
};