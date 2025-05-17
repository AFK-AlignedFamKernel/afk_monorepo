import {
  QueryClient,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {useEffect} from 'react';

export const useApiMutation = <
  TFnData = unknown,
  TData = TFnData,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TFnData, AxiosError, TVariables, TContext>,
  showErrorToast = true,
  queryClient: QueryClient | undefined = undefined,
): UseMutationResult<TData, AxiosError, TVariables, TContext> => {
  const mutation = useMutation(options, queryClient);

  // const {showToast} = useToast();

  useEffect(() => {
    if (showErrorToast && mutation.error) {
      const {response} = mutation.error;
      if (!response?.data || typeof response.data !== 'object' || !('code' in response.data)) {
        // showToast({
        //   type: 'error',
        //   title: 'Request failed with no response, please try again later.',
        // });
        return;
      }

      // showToast({
      //   type: 'error',
      //   title: `Request failed with error code: ${response.data.code}`,
      // });
    }

    return () => {
      //
    };
  }, [showErrorToast, mutation.error]);

  return mutation as any;
};
