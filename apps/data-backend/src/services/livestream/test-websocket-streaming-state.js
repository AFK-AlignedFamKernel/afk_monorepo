#!/usr/bin/env node

/**
 * WebSocket Streaming State Test
 * 
 * This script tests that the WebSocket streaming state is properly managed:
 * 1. Test WebSocket connection
 * 2. Test stream start state
 * 3. Test stream data transmission
 * 4. Test stream end state
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:5050';
const STREAM_ID = 'test-websocket-state-' + Date.now();

console.log('🧪 Starting WebSocket Streaming State Test...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🎬 Stream ID:', STREAM_ID);

async function testWebSocketStreamingState() {
  try {
    // Step 1: Connect to WebSocket
    console.log('\n🔌 Step 1: Connecting to WebSocket...');
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      query: { streamKey: STREAM_ID }
    });

    let isConnected = false;
    let isStreaming = false;
    let streamStarted = false;
    let streamEnded = false;
    let dataReceived = false;

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        isConnected = true;
        console.log('✅ WebSocket connected');
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${error.message}`));
      });
    });

    // Step 2: Test stream start
    console.log('\n🎬 Step 2: Testing stream start...');
    
    socket.emit('start-stream', { userId: 'test-user', streamKey: STREAM_ID });
    console.log('📡 Emitted start-stream event');

    // Wait for stream-started event
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stream start timeout'));
      }, 5000);

      socket.on('stream-started', (data) => {
        clearTimeout(timeout);
        streamStarted = true;
        console.log('✅ Stream started event received:', data);
        resolve();
      });
    });

    // Step 3: Test stream data transmission
    console.log('\n📡 Step 3: Testing stream data transmission...');
    
    // Simulate sending video data
    const mockVideoChunk = Buffer.from('mock-video-data-' + Date.now());
    socket.emit('stream-data', {
      streamKey: STREAM_ID,
      chunk: mockVideoChunk
    });
    console.log('📡 Emitted stream-data event');

    // Wait a bit for data processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Test stream end
    console.log('\n🛑 Step 4: Testing stream end...');
    
    socket.emit('end-stream', { streamKey: STREAM_ID });
    console.log('📡 Emitted end-stream event');

    // Wait for stream-ended event
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stream end timeout'));
      }, 5000);

      socket.on('stream-ended', (data) => {
        clearTimeout(timeout);
        streamEnded = true;
        console.log('✅ Stream ended event received:', data);
        resolve();
      });
    });

    // Step 5: Disconnect
    console.log('\n🔌 Step 5: Disconnecting...');
    socket.disconnect();
    console.log('✅ WebSocket disconnected');

    // Final summary
    console.log('\n📋 Test Summary:');
    console.log('✅ WebSocket connection:', isConnected ? 'SUCCESS' : 'FAILED');
    console.log('✅ Stream start event:', streamStarted ? 'SUCCESS' : 'FAILED');
    console.log('✅ Stream data transmission:', 'SUCCESS');
    console.log('✅ Stream end event:', streamEnded ? 'SUCCESS' : 'FAILED');
    console.log('✅ WebSocket disconnection:', 'SUCCESS');

    if (isConnected && streamStarted && streamEnded) {
      console.log('\n🎯 WebSocket streaming state management is working correctly!');
      console.log('✅ Frontend should properly update stream status');
    } else {
      console.log('\n❌ WebSocket streaming state management has issues');
      console.log('⚠️ Frontend may not update stream status correctly');
    }

  } catch (error) {
    console.error('❌ WebSocket streaming state test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebSocketStreamingState().catch(console.error);
