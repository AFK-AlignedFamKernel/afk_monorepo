import {useQuery, useMutation} from '@tanstack/react-query';
import { ApiIndexerInstance } from '../../services/api';
import { AccountInterface, Call } from 'starknet';

export interface NameserviceData {
  owner_address: string;
  username: string;
  time_stamp: string;
  paid: string;
  quote_address: string;
  expiry: string;
}

export const useNameserviceData = () => {
  const query = useQuery({
    queryKey: ['nameservice_data'],
    queryFn: async () => {
      const response = await ApiIndexerInstance.get('/username-claimed');
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch nameservice data');
      }

      return response.data.data as NameserviceData[];
    },
  });

  const prepareBuyUsername = async (account: AccountInterface, username: string): Promise<Call[]> => {
    try {
      const calls: Call[] = [{
        contractAddress: process.env.NAMESERVICE_CONTRACT_ADDRESS as string,
        entrypoint: 'buy_username',
        calldata: [username]
      }];
      
      return calls;
    } catch (error) {
      console.error('Error preparing username purchase:', error);
      throw error;
    }
  };

  return {
    ...query,
    prepareBuyUsername
  };
};

export const useNameserviceByUsername = (username: string) => {
  return useQuery({
    queryKey: ['nameservice_username', username],
    queryFn: async () => {
      const response = await ApiIndexerInstance.get(`/username-claimed/username/${username}`);
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch nameservice data');
      }

      return response.data.data as NameserviceData;
    },
    enabled: !!username,
  });
};