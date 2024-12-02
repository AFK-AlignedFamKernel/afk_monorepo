import { useQuery } from '@tanstack/react-query';
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
  const { account } = useAccount();

  const fetchNames = async () => {
    console.log('Fetching names from endpoint:', NAMESERVICE_ENDPOINTS.claimed);
    const response = await ApiIndexerInstance.get(NAMESERVICE_ENDPOINTS.claimed);
    
    console.log('Names API Response:', {
      status: response.status,
      dataLength: response.data?.data?.length,
      rawData: response.data
    });
    
    if (!response.data?.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid data format received');
    }

    const formattedNames = (response.data.data as RawName[]).map(name => ({
      name: decodeUsername(name.username),
      owner: name.owner_address,
      expiryTime: formatExpiry(name.expiry),
      paid: name.paid
    }));

    console.log('Formatted names:', formattedNames);
    return formattedNames;
  };

  const query = useQuery({
    queryKey: ['names', account?.address],
    queryFn: fetchNames
  });

  return {
    names: query.data ?? [],
    isLoading: query.isLoading,
    fetchNames: query.refetch
  };
}; 