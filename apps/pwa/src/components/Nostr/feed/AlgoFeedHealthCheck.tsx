'use client';

import React, { useState, useEffect } from 'react';
import { algoRelayService } from '@/services/algoRelayService';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface HealthStatus {
  api: boolean;
  websocket: boolean;
  apiLatency?: number;
  wsLatency?: number;
  apiError?: string;
  wsError?: string;
}

interface AlgoFeedHealthCheckProps {
  onHealthChange?: (isHealthy: boolean) => void;
}

const AlgoFeedHealthCheck: React.FC<AlgoFeedHealthCheckProps> = ({ onHealthChange }) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    
    try {
      // Check API health
      const apiStartTime = Date.now();
      const apiData = await algoRelayService.getTrendingNotes(1);
      const apiLatency = Date.now() - apiStartTime;
      const apiHealthy = apiData !== null && apiData !== undefined;
      
      // Check WebSocket health
      const wsResult = await algoRelayService.verifyWebSocketConnection();
      
      const status: HealthStatus = {
        api: apiHealthy,
        websocket: wsResult.connected,
        apiLatency: apiLatency,
        wsLatency: wsResult.latency,
        apiError: apiHealthy ? undefined : 'API returned null/undefined data',
        wsError: wsResult.error
      };
      
      setHealthStatus(status);
      onHealthChange?.(apiHealthy && wsResult.connected);
      
      if (apiHealthy && wsResult.connected) {
        console.log('✅ Algo-relay backend is fully healthy');
      } else {
        console.warn('⚠️ Algo-relay backend has issues:', status);
      }
    } catch (error) {
      console.error('❌ Algo-relay backend health check failed:', error);
      setHealthStatus({
        api: false,
        websocket: false,
        apiError: error instanceof Error ? error.message : 'Unknown error'
      });
      onHealthChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (healthStatus === null) {
    return (
      <div className={styles['algo-feed__health-check']}>
        <div className={styles['algo-feed__health-loading']}>
          Checking backend health...
        </div>
      </div>
    );
  }

  const isFullyHealthy = healthStatus.api && healthStatus.websocket;

  return (
    <div className={styles['algo-feed__health-check']}>
      <div className={`${styles['algo-feed__health-status']} ${isFullyHealthy ? styles['algo-feed__health-status--healthy'] : styles['algo-feed__health-status--unhealthy']}`}>
        <span className={styles['algo-feed__health-icon']}>
          {isFullyHealthy ? '✅' : '❌'}
        </span>
        <span className={styles['algo-feed__health-text']}>
          {isFullyHealthy ? 'Backend Connected' : 'Backend Issues'}
        </span>
        <button 
          onClick={checkHealth}
          disabled={isChecking}
          className={styles['algo-feed__health-retry']}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </div>
      
      {/* API Status */}
      <div className={styles['algo-feed__health-details']}>
        <div className={`${styles['algo-feed__health-item']} ${healthStatus.api ? styles['algo-feed__health-item--success'] : styles['algo-feed__health-item--error']}`}>
          <span>API:</span>
          <span>{healthStatus.api ? '✅ Connected' : '❌ Failed'}</span>
          {healthStatus.apiLatency && <span>({healthStatus.apiLatency}ms)</span>}
        </div>
        
        <div className={`${styles['algo-feed__health-item']} ${healthStatus.websocket ? styles['algo-feed__health-item--success'] : styles['algo-feed__health-item--error']}`}>
          <span>WebSocket:</span>
          <span>{healthStatus.websocket ? '✅ Connected' : '❌ Failed'}</span>
          {healthStatus.wsLatency && <span>({healthStatus.wsLatency}ms)</span>}
        </div>
      </div>
      
      {!isFullyHealthy && (
        <div className={styles['algo-feed__health-troubleshoot']}>
          <p>Troubleshooting:</p>
          <ul>
            <li>Make sure algo-relay backend is running on port 3334</li>
            <li>Check that CORS is properly configured</li>
            <li>Verify environment variables are set correctly</li>
            <li>Check browser console for detailed error messages</li>
            {healthStatus.apiError && <li>API Error: {healthStatus.apiError}</li>}
            {healthStatus.wsError && <li>WebSocket Error: {healthStatus.wsError}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AlgoFeedHealthCheck; 