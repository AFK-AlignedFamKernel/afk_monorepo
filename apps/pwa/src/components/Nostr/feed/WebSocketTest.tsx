'use client';

import React, { useState, useEffect, useRef } from 'react';
import { algoRelayService } from '@/services/algoRelayService';
import styles from '@/styles/nostr/feed.module.scss';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

const WebSocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    try {
      setConnectionStatus('Connecting...');
      
      wsRef.current = algoRelayService.connectWebSocket(
        (data) => {
          const message: WebSocketMessage = {
            type: data.type || 'unknown',
            data: data,
            timestamp: Date.now()
          };
          
          setMessages(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 messages
          console.log('WebSocket message received:', message);
        },
        (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('Error');
          setIsConnected(false);
        }
      );

      wsRef.current.onopen = () => {
        setConnectionStatus('Connected');
        setIsConnected(true);
        console.log('WebSocket connected successfully');
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('Disconnected');
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('Failed to connect');
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendTestMessage = () => {
    if (wsRef.current && isConnected) {
      const testMessage = {
        type: 'test',
        data: {
          message: 'Hello from frontend!',
          timestamp: Date.now()
        }
      };
      
      wsRef.current.send(JSON.stringify(testMessage));
      console.log('Test message sent:', testMessage);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className={styles['algo-feed__websocket-test']}>
      <div className={styles['algo-feed__websocket-header']}>
        <h3>WebSocket Connection Test</h3>
        <div className={styles['algo-feed__websocket-status']}>
          <span className={`${styles['algo-feed__websocket-indicator']} ${isConnected ? styles['algo-feed__websocket-indicator--connected'] : styles['algo-feed__websocket-indicator--disconnected']}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span>{connectionStatus}</span>
        </div>
      </div>

      <div className={styles['algo-feed__websocket-controls']}>
        {!isConnected ? (
          <button 
            onClick={connectWebSocket}
            className={styles['algo-feed__websocket-button']}
          >
            Connect WebSocket
          </button>
        ) : (
          <button 
            onClick={disconnectWebSocket}
            className={styles['algo-feed__websocket-button']}
          >
            Disconnect WebSocket
          </button>
        )}
        
        {isConnected && (
          <button 
            onClick={sendTestMessage}
            className={styles['algo-feed__websocket-button']}
          >
            Send Test Message
          </button>
        )}
        
        <button 
          onClick={clearMessages}
          className={styles['algo-feed__websocket-button']}
        >
          Clear Messages
        </button>
      </div>

      <div className={styles['algo-feed__websocket-messages']}>
        <h4>Messages ({messages.length})</h4>
        {messages.length === 0 ? (
          <p className={styles['algo-feed__websocket-no-messages']}>
            No messages received yet
          </p>
        ) : (
          <div className={styles['algo-feed__websocket-message-list']}>
            {messages.map((message, index) => (
              <div key={index} className={styles['algo-feed__websocket-message']}>
                <div className={styles['algo-feed__websocket-message-header']}>
                  <span className={styles['algo-feed__websocket-message-type']}>
                    {message.type}
                  </span>
                  <span className={styles['algo-feed__websocket-message-time']}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className={styles['algo-feed__websocket-message-data']}>
                  {JSON.stringify(message.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketTest; 