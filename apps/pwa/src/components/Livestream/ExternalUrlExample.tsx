'use client';
import React, { useState } from 'react';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import styles from './styles.module.scss';

/**
 * Example component demonstrating how to use external streaming URLs
 * This shows how the StreamVideoPlayer can handle various external streaming platforms
 */
export const ExternalUrlExample: React.FC = () => {
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

  // Example external URLs for different platforms
  const exampleUrls = [
    {
      name: 'YouTube Live Stream',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'YouTube live stream URL'
    },
    {
      name: 'Twitch Stream',
      url: 'https://www.twitch.tv/example',
      description: 'Twitch live stream URL'
    },
    {
      name: 'External HLS Stream',
      url: 'https://example.com/stream.m3u8',
      description: 'External HLS manifest URL'
    },
    {
      name: 'Vimeo Live',
      url: 'https://vimeo.com/event/123456',
      description: 'Vimeo live event URL'
    }
  ];

  const currentUrl = selectedUrl || customUrl;

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <h1 className={styles.headerText}>External Streaming URL Example</h1>
        
        <div className={styles.section}>
          <h2>Select Example URL:</h2>
          <div className={styles.urlList}>
            {exampleUrls.map((example, index) => (
              <button
                key={index}
                className={`${styles.urlButton} ${selectedUrl === example.url ? styles.active : ''}`}
                onClick={() => setSelectedUrl(example.url)}
              >
                <div className={styles.urlName}>{example.name}</div>
                <div className={styles.urlDescription}>{example.description}</div>
                <div className={styles.urlValue}>{example.url}</div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Or Enter Custom URL:</h2>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter external streaming URL (YouTube, Twitch, HLS, etc.)"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setSelectedUrl(''); // Clear selected URL when typing custom
            }}
          />
        </div>

        {currentUrl && (
          <div className={styles.section}>
            <h2>Video Player:</h2>
            <div className={styles.videoContainer}>
              <StreamVideoPlayer
                streamingUrl={currentUrl}
                isStreamer={false}
                className={styles.exampleVideoPlayer}
              />
            </div>
            <div className={styles.urlInfo}>
              <p><strong>Current URL:</strong> {currentUrl}</p>
              <p><strong>URL Type:</strong> {currentUrl.includes('.m3u8') ? 'HLS Stream' : 'External Platform'}</p>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2>How it works:</h2>
          <div className={styles.infoBox}>
            <p>The StreamVideoPlayer now supports:</p>
            <ul>
              <li><strong>Internal HLS streams:</strong> Our own livestream URLs (e.g., /livestream/streamId/stream.m3u8)</li>
              <li><strong>External HLS streams:</strong> Any .m3u8 manifest URL from other sources</li>
              <li><strong>External platform URLs:</strong> YouTube, Twitch, Vimeo, etc. (browser-dependent support)</li>
            </ul>
            <p>The player automatically detects the URL type and handles each appropriately:</p>
            <ul>
              <li>Internal streams: Full status checking and WebSocket integration</li>
              <li>External HLS: Direct video loading with HLS support</li>
              <li>External platforms: Direct video loading (may require user interaction for autoplay)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
