'use client';

import React, { useState, useEffect } from 'react';
import { algoRelayService } from '@/services/algoRelayService';
import styles from '@/styles/nostr/feed.module.scss';

interface AlgoFeedHealthCheckProps {
  onHealthChange?: (isHealthy: boolean) => void;
}

const AlgoFeedHealthCheck: React.FC<AlgoFeedHealthCheckProps> = ({ onHealthChange }) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      // Try to fetch trending notes as a health check
      const data = await algoRelayService.getTrendingNotes(1);
      const healthy = data !== null && data !== undefined;
      setIsHealthy(healthy);
      onHealthChange?.(healthy);
      
      if (healthy) {
        console.log('✅ Algo-relay backend is healthy');
      } else {
        console.warn('⚠️ Algo-relay backend returned null/undefined data');
      }
    } catch (error) {
      console.error('❌ Algo-relay backend health check failed:', error);
      setIsHealthy(false);
      onHealthChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (isHealthy === null) {
    return (
      <div className={styles['algo-feed__health-check']}>
        <div className={styles['algo-feed__health-loading']}>
          Checking backend health...
        </div>
      </div>
    );
  }

  return (
    <div className={styles['algo-feed__health-check']}>
      <div className={`${styles['algo-feed__health-status']} ${isHealthy ? styles['algo-feed__health-status--healthy'] : styles['algo-feed__health-status--unhealthy']}`}>
        <span className={styles['algo-feed__health-icon']}>
          {isHealthy ? '✅' : '❌'}
        </span>
        <span className={styles['algo-feed__health-text']}>
          {isHealthy ? 'Backend Connected' : 'Backend Unavailable'}
        </span>
        <button 
          onClick={checkHealth}
          disabled={isChecking}
          className={styles['algo-feed__health-retry']}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </div>
      
      {!isHealthy && (
        <div className={styles['algo-feed__health-troubleshoot']}>
          <p>Troubleshooting:</p>
          <ul>
            <li>Make sure algo-relay backend is running on port 3334</li>
            <li>Check that CORS is properly configured</li>
            <li>Verify environment variables are set correctly</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AlgoFeedHealthCheck; 