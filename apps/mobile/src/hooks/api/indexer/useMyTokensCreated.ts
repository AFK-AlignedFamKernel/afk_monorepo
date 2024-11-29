import {useQuery} from '@tanstack/react-query';
import {ApiIndexerInstance} from '../../../services/api';
import {useEffect} from 'react';

// Add this function to test the connection
const testEndpoint = async () => {
  try {
    console.log('Testing username-claimed endpoint...');
    const res = await fetch('https://afk-monorepo.onrender.com/username-claimed');
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Endpoint test failed:', error);
    throw error;
  }
};

export const useMyTokensCreated = (launch?: string) => {
  // Add the test call
  useEffect(() => {
    testEndpoint();
  }, []);

  return useQuery({
    queryKey: launch ? ['token', launch] : ['deploy_launch'],
    queryFn: async () => {
      const endpoint = launch ? `/deploy-token/${launch}` : '/deploy-token';
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token launch');
      }

      return res.data;
    },
  });
};