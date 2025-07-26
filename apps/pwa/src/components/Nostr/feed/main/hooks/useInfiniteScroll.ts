import { useCallback, useEffect, useRef, useState } from 'react';

export const useInfiniteScroll = (
    hasMore: boolean,
    loadingMore: boolean,
    fetchCurrentTabData: (append: boolean) => Promise<void>
  ) => {
    const [isInfiniteScrollLoading, setIsInfiniteScrollLoading] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const isLoadingRef = useRef(false); // Use ref to prevent multiple simultaneous loads
  
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      // Prevent multiple simultaneous loads
      if (entry.isIntersecting && !loadingMore && !isInfiniteScrollLoading && hasMore && !isLoadingRef.current) {
        console.log('Intersection observer triggered - loading more content');
        isLoadingRef.current = true;
        setIsInfiniteScrollLoading(true);
        
        fetchCurrentTabData(true)
          .then(() => {
            console.log('Infinite scroll load completed successfully');
          })
          .catch((error) => {
            console.error('Infinite scroll load failed:', error);
          })
          .finally(() => {
            setIsInfiniteScrollLoading(false);
            isLoadingRef.current = false;
          });
      }
    }, [loadingMore, isInfiniteScrollLoading, hasMore, fetchCurrentTabData]);
  
    useEffect(() => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
  
      // Create new observer with more conservative settings
      observerRef.current = new IntersectionObserver(handleObserver, {
        rootMargin: '0px 0px 200px 0px', // Reduced margin to prevent premature triggering
        threshold: 0.1,
      });
  
      // Observe the loader element
      if (loaderRef.current) {
        observerRef.current.observe(loaderRef.current);
      }
  
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [handleObserver, hasMore, loadingMore, isInfiniteScrollLoading]);
  
    return { loaderRef, isInfiniteScrollLoading, setIsInfiniteScrollLoading };
  };