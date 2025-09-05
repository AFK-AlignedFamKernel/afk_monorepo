'use client';
import React, { useState } from 'react';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import styles from './styles.module.scss';

/**
 * Test component to verify external URL rendering without event pushing
 */
export const ExternalUrlTest: React.FC = () => {
  const [testUrl, setTestUrl] = useState<string>('https://example.com/stream.m3u8');
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const testUrls = [
    'https://example.com/stream.m3u8',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.twitch.tv/example',
    'https://vimeo.com/event/123456',
    'https://cdn.example.com/live/stream.m3u8'
  ];

  const handleTestUrl = (url: string) => {
    setTestUrl(url);
    setIsRendering(true);
  };

  const handleStopTest = () => {
    setIsRendering(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <h1 className={styles.headerText}>External URL Rendering Test</h1>
        
        <div className={styles.section}>
          <h2>Test URLs:</h2>
          <div className={styles.urlList}>
            {testUrls.map((url, index) => (
              <button
                key={index}
                className={`${styles.urlButton} ${testUrl === url ? styles.active : ''}`}
                onClick={() => handleTestUrl(url)}
              >
                {url}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Custom URL:</h2>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter external streaming URL"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
          />
        </div>

        <div className={styles.section}>
          <h2>Test Controls:</h2>
          <div className={styles.buttonGroup}>
            <button
              className={styles.testButton}
              onClick={() => handleTestUrl(testUrl)}
              disabled={!testUrl}
            >
              Test URL
            </button>
            <button
              className={styles.stopButton}
              onClick={handleStopTest}
            >
              Stop Test
            </button>
          </div>
        </div>

        {isRendering && testUrl && (
          <div className={styles.section}>
            <h2>Rendering Test:</h2>
            <div className={styles.testInfo}>
              <p><strong>Testing URL:</strong> {testUrl}</p>
              <p><strong>Expected Behavior:</strong> Direct rendering without WebSocket join or event pushing</p>
              <p><strong>Console Logs:</strong> Should show "External URL detected, skipping..." messages</p>
            </div>
            
            <div className={styles.videoContainer}>
              <StreamVideoPlayer
                streamingUrl={testUrl}
                isStreamer={false}
                streamId="test-external"
                className={styles.testVideoPlayer}
              />
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2>Verification Checklist:</h2>
          <div className={styles.checklist}>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="priority" />
              <label htmlFor="priority">NIP-53 event URLs take priority over internal URLs</label>
            </div>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="no-websocket" />
              <label htmlFor="no-websocket">External URLs don't join WebSocket rooms</label>
            </div>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="no-events" />
              <label htmlFor="no-events">External URLs don't push events to backend</label>
            </div>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="direct-render" />
              <label htmlFor="direct-render">External URLs render directly in video player</label>
            </div>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="no-status-check" />
              <label htmlFor="no-status-check">External URLs skip status checking</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
