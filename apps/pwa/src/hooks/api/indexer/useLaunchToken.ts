import { useQuery } from '@tanstack/react-query';
import { TokenDeployInterface } from '@/types/keys';

interface LaunchTokenResponse {
  data: TokenDeployInterface;
  isLoading: boolean;
  error: Error | null;
}

export const useLaunchToken = (launchId: string): LaunchTokenResponse => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['launch', launchId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy-launch/${launchId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch launch token');
      }
      
      return response.json();
    },
    enabled: !!launchId,
  });

  return {
    data: data?.data,
    isLoading,
    error: error as Error | null,
  };
}; 