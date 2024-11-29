import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { decodeUsername, formatExpiry } from '../../utils/format';
import { ApiIndexerInstance } from '../../services/api';
import { NAMESERVICE_ENDPOINTS } from './useNameservice';

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
        const response = await ApiIndexerInstance.get(NAMESERVICE_ENDPOINTS.claimed);
        
        if (!response.data?.data || !Array.isArray(response.data.data)) {
          console.error('Invalid data format received:', response.data);
          return;
        }

        const formattedNames = (response.data.data as RawName[]).map(name => ({
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