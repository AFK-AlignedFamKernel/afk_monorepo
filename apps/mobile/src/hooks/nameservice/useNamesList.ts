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
        const response = await fetch('https://afk-monorepo.onrender.com/username-claimed');
        const data = await response.json();
        
        const formattedNames = (data.data as RawName[]).map(name => ({
          name: decodeUsername(name.username),
          owner: name.owner_address,
          expiryTime: formatExpiry(name.expiry),
          paid: name.paid
        }));

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