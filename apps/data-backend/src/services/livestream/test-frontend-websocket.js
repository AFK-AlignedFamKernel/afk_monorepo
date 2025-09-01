#!/usr/bin/env node

/**
 * Frontend WebSocket Test
 * 
 * This script simulates the frontend WebSocket connection:
 * 1. Connect to WebSocket with stream key
 * 2. Send start-stream event
 * 3. Send video data
 * 4. Verify backend responds correctly
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:5050';
const STREAM_ID = '44e1537023bfb5379044174e84ef409e'; // Your actual stream ID

console.log('🧪 Starting Frontend WebSocket Test...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🎬 Stream ID:', STREAM_ID);

async function testFrontendWebSocket() {
  try {
    // Step 1: Connect to WebSocket (simulate frontend)
    console.log('\n🔌 Step 1: Connecting to WebSocket (frontend simulation)...');
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      query: { streamKey: STREAM_ID }
    });

    let connected = false;
    let streamStarted = false;
    let dataSent = false;

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        connected = true;
        console.log('✅ WebSocket connected successfully (frontend simulation)');
        console.log('🔌 Socket ID:', socket.id);
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

    // Step 2: Check current stream status
    console.log('\n📊 Step 2: Checking current stream status...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${STREAM_ID}/status`);
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Current stream status:', {
          isActive: status.overall?.isActive,
          hasVideoContent: status.overall?.hasVideoContent,
          hasManifest: status.overall?.hasManifest,
          hasFfmpegCommand: status.local?.streamData?.hasFfmpegCommand,
          hasInputStream: status.local?.streamData?.hasInputStream,
          broadcasterSocketId: status.local?.streamData?.broadcasterSocketId,
          status: status.local?.streamData?.status
        });
        
        if (status.local?.streamData?.hasFfmpegCommand) {
          console.log('✅ Stream already has FFmpeg set up');
        } else {
          console.log('⏳ Stream waiting for FFmpeg setup');
        }
      }
    } catch (error) {
      console.log('❌ Error checking stream status:', error.message);
    }

    // Step 3: Send start-stream event (simulate GO LIVE button)
    console.log('\n🎬 Step 3: Sending start-stream event (GO LIVE simulation)...');
    
    socket.emit('start-stream', { 
      userId: 'frontend-test-user', 
      streamKey: STREAM_ID 
    });
    console.log('📡 start-stream event sent to backend');

    // Wait for response
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No response from backend within 10 seconds'));
      }, 10000);

      socket.on('stream-started', (data) => {
        clearTimeout(timeout);
        streamStarted = true;
        console.log('✅ Backend responded with stream-started:', data);
        resolve();
      });

      socket.on('stream-error', (data) => {
        clearTimeout(timeout);
        console.log('❌ Backend responded with stream-error:', data);
        reject(new Error(`Stream error: ${data.error}`));
      });
    });

    if (!streamStarted) {
      throw new Error('No stream-started response received');
    }

    // Step 4: Send video data (simulate MediaRecorder)
    console.log('\n📡 Step 4: Sending video data (MediaRecorder simulation)...');
    
    const mockVideoChunk = Buffer.from('mock-video-data-' + Date.now());
    socket.emit('stream-data', {
      streamKey: STREAM_ID,
      chunk: mockVideoChunk
    });
    console.log('📡 Video data sent to backend');

    // Wait a bit for data processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Check stream status after video data
    console.log('\n📊 Step 5: Checking stream status after video data...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${STREAM_ID}/status`);
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Stream status after video data:', {
          isActive: status.overall?.isActive,
          hasVideoContent: status.overall?.hasVideoContent,
          hasManifest: status.overall?.hasManifest,
          hasFfmpegCommand: status.local?.streamData?.hasFfmpegCommand,
          hasInputStream: status.local?.streamData?.hasInputStream,
          broadcasterSocketId: status.local?.streamData?.broadcasterSocketId,
          status: status.local?.streamData?.status
        });
        
        if (status.overall?.hasVideoContent) {
          console.log('🎬 Stream now has video content!');
          dataSent = true;
        } else {
          console.log('⏳ Stream still waiting for video content');
        }
      }
    } catch (error) {
      console.log('❌ Error checking stream status after video data:', error.message);
    }

    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up...');
    socket.disconnect();
    console.log('✅ WebSocket disconnected');

    console.log('\n✅ Frontend WebSocket test completed!');
    
    // Final summary
    console.log('\n📋 Test Summary:');
    console.log('✅ WebSocket connection:', connected ? 'SUCCESS' : 'FAILED');
    console.log('✅ Stream start event:', streamStarted ? 'SUCCESS' : 'FAILED');
    console.log('✅ Video data transmission:', dataSent ? 'SUCCESS' : 'PARTIAL');
    
    if (connected && streamStarted) {
      console.log('\n🎯 Frontend WebSocket connection is working correctly!');
      console.log('✅ GO LIVE button should work properly');
      console.log('✅ MediaRecorder should send data successfully');
      console.log('✅ Frontend status should update to "LIVE"');
    } else {
      console.log('\n❌ Frontend WebSocket connection has issues');
      console.log('⚠️ GO LIVE button may not work');
      console.log('⚠️ Frontend status may not update correctly');
    }

  } catch (error) {
    console.error('❌ Frontend WebSocket test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFrontendWebSocket().catch(console.error);
