import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { decodeUsername, formatExpiry } from '../../utils/format';

interface RawName {
  owner_address: string;
  username: string;
  time_stamp: string | null;
  paid: string;
  quote_address: string | null;
  expiry: string;
}

interface FormattedName {
  name: string;
  owner: string;
  expiryTime: Date;
  paid: string;
}

export const useNamesList = () => {
  const [names, setNames] = useState<FormattedName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useAccount();

  useEffect(() => {
    const fetchNames = async () => {
      try {
        console.log('Fetching names from API...');
        const response = await fetch('https://afk-monorepo.onrender.com/username-claimed');
        console.log('Response status:', response.status);
        
        const rawData = await response.json();
        console.log('Raw API Response:', {
          data: rawData.data,
          hasData: !!rawData.data,
          dataLength: rawData.data?.length,
          fullResponse: rawData
        });

        if (!rawData.data || !Array.isArray(rawData.data)) {
          console.error('Invalid data format received:', rawData);
          return;
        }

        const formattedNames = (rawData.data as RawName[]).map(name => {
          console.log('Processing name entry:', name);
          return {
            name: decodeUsername(name.username),
            owner: name.owner_address,
            expiryTime: formatExpiry(name.expiry),
            paid: name.paid
          };
        });

        console.log('Final formatted names:', formattedNames);
        setNames(formattedNames);
      } catch (error) {
        console.error('Error fetching names:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [account?.address]);

  return { names, isLoading };
}; 