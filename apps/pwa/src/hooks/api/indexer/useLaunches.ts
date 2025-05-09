import { useQuery } from '@tanstack/react-query';
import { TokenDeployInterface } from '@/types/keys';

interface LaunchesResponse {
  data: TokenDeployInterface[];
  isLoading: boolean;
  error: Error | null;
}

export const useLaunches = (launch?: string): LaunchesResponse => {
  const { data, isLoading, error } = useQuery({
    queryKey: launch ? ['launch', launch] : ['deploy_launch'],
    queryFn: async () => {
      const endpoint = launch ? `/deploy-launch/${launch}` : '/deploy-launch';
      const response = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token launch');
      }
      
      return response.json();
    },
  });

  return {
    data: data?.data || [],
    isLoading,
    error: error as Error | null,
  };
}; 