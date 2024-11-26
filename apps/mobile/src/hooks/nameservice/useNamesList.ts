import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';

export const useNamesList = () => {
  const [names, setNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useAccount();

  useEffect(() => {
    // TODO: Add indexer integration when ready
    setIsLoading(false);
  }, [account?.address]);

  return { names, isLoading };
}; 