import { useQuery } from '@tanstack/react-query';
import { TokenDeployInterface } from '@/types/keys';

interface TokensResponse {
  data: TokenDeployInterface[];
  isLoading: boolean;
  error: Error | null;
}

export const useTokens = (): TokensResponse => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy`);
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
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