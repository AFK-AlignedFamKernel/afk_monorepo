#!/usr/bin/env node

/**
 * Simple WebSocket Connection Test
 * 
 * This script tests basic WebSocket connectivity:
 * 1. Connect to WebSocket
 * 2. Send start-stream event
 * 3. Check if backend responds
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:5050';
const STREAM_ID = 'test-simple-' + Date.now();

console.log('🧪 Starting Simple WebSocket Connection Test...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🎬 Stream ID:', STREAM_ID);

async function testSimpleWebSocketConnection() {
  try {
    // Step 1: Connect to WebSocket
    console.log('\n🔌 Step 1: Connecting to WebSocket...');
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      query: { streamKey: STREAM_ID }
    });

    let connected = false;

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        connected = true;
        console.log('✅ WebSocket connected successfully');
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${error.message}`));
      });
    });

    if (!connected) {
      throw new Error('WebSocket connection failed');
    }

    // Step 2: Send start-stream event
    console.log('\n🎬 Step 2: Sending start-stream event...');
    
    socket.emit('start-stream', { 
      userId: 'test-user-' + Date.now(), 
      streamKey: STREAM_ID 
    });
    console.log('📡 start-stream event sent');

    // Step 3: Wait for response
    console.log('\n⏳ Step 3: Waiting for backend response...');
    
    let responseReceived = false;
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No response from backend within 10 seconds'));
      }, 10000);

      socket.on('stream-started', (data) => {
        clearTimeout(timeout);
        responseReceived = true;
        console.log('✅ Backend responded with stream-started:', data);
        resolve();
      });

      socket.on('stream-error', (data) => {
        clearTimeout(timeout);
        console.log('❌ Backend responded with stream-error:', data);
        reject(new Error(`Stream error: ${data.error}`));
      });
    });

    if (!responseReceived) {
      throw new Error('No response received from backend');
    }

    // Step 4: Check stream status
    console.log('\n📊 Step 4: Checking stream status...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${STREAM_ID}/status`);
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Stream status after start-stream:', {
          isActive: status.overall?.isActive,
          hasVideoContent: status.overall?.hasVideoContent,
          hasManifest: status.overall?.hasManifest,
          hasFfmpegCommand: status.local?.streamData?.hasFfmpegCommand,
          hasInputStream: status.local?.streamData?.hasInputStream,
          broadcasterSocketId: status.local?.streamData?.broadcasterSocketId
        });
        
        if (status.local?.streamData?.hasFfmpegCommand) {
          console.log('✅ FFmpeg is now set up!');
        } else {
          console.log('❌ FFmpeg is still not set up');
        }
      } else {
        console.log('❌ Failed to get stream status');
      }
    } catch (error) {
      console.log('❌ Error checking stream status:', error.message);
    }

    // Step 5: Cleanup
    console.log('\n🧹 Step 5: Cleaning up...');
    socket.disconnect();
    console.log('✅ WebSocket disconnected');

    console.log('\n✅ Simple WebSocket connection test completed!');
    
    if (responseReceived) {
      console.log('\n🎯 WebSocket connection is working correctly!');
      console.log('✅ Frontend should be able to start streams');
    } else {
      console.log('\n❌ WebSocket connection has issues');
      console.log('⚠️ Frontend may not be able to start streams');
    }

  } catch (error) {
    console.error('❌ Simple WebSocket connection test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSimpleWebSocketConnection().catch(console.error);
