#!/usr/bin/env node

/**
 * Simple Streaming Test Script
 * 
 * This script tests the streaming process step by step:
 * 1. WebSocket connection
 * 2. Stream start
 * 3. Video data flow
 * 4. HLS segment generation
 */

const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5050';
const STREAM_ID = 'test-stream-' + Date.now();
const USER_ID = 'test-user-' + Date.now();

console.log('🧪 Starting streaming test...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🎬 Stream ID:', STREAM_ID);
console.log('👤 User ID:', USER_ID);

async function testStreaming() {
  try {
    // Step 1: Connect to WebSocket
    console.log('\n🔌 Step 1: Connecting to WebSocket...');
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      query: { streamKey: STREAM_ID }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connected successfully');
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });
    });

    // Step 2: Start stream
    console.log('\n🎬 Step 2: Starting stream...');
    socket.emit('start-stream', {
      userId: USER_ID,
      streamKey: STREAM_ID
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stream start timeout'));
      }, 10000);

      socket.on('stream-started', (data) => {
        clearTimeout(timeout);
        console.log('✅ Stream started successfully:', data);
        resolve();
      });

      socket.on('stream-error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Stream start failed: ${error.error}`));
      });
    });

    // Step 3: Send test video data
    console.log('\n📡 Step 3: Sending test video data...');
    const testChunk = Buffer.alloc(1024, 'test-data');
    
    for (let i = 0; i < 5; i++) {
      console.log(`📡 Sending chunk ${i + 1}/5 (${testChunk.length} bytes)`);
      socket.emit('stream-data', {
        streamKey: STREAM_ID,
        chunk: testChunk
      });
      
      // Wait between chunks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 4: Check if HLS files were generated
    console.log('\n🎯 Step 4: Checking HLS file generation...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for FFmpeg processing
    
    const streamPath = path.join(process.cwd(), 'public', 'livestreams', STREAM_ID);
    
    if (fs.existsSync(streamPath)) {
      const files = fs.readdirSync(streamPath);
      const segments = files.filter(file => file.endsWith('.ts'));
      const manifest = files.find(file => file.endsWith('.m3u8'));
      
      console.log('📁 Stream directory contents:', files);
      console.log('🎬 HLS segments found:', segments.length);
      console.log('📋 HLS manifest found:', !!manifest);
      
      if (manifest) {
        const manifestPath = path.join(streamPath, manifest);
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        console.log('📋 Manifest content:');
        console.log(manifestContent);
      }
      
      if (segments.length > 0) {
        console.log('✅ HLS segments generated successfully!');
      } else {
        console.log('⚠️ No HLS segments generated');
      }
    } else {
      console.log('❌ Stream directory not found');
    }

    // Step 5: Test HTTP endpoints
    console.log('\n🌐 Step 5: Testing HTTP endpoints...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${STREAM_ID}/stream.m3u8`);
      if (response.ok) {
        const manifest = await response.text();
        console.log('✅ HLS manifest endpoint working');
        console.log('📋 Manifest size:', manifest.length, 'characters');
      } else {
        console.log('❌ HLS manifest endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ HLS manifest endpoint error:', error.message);
    }

    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up...');
    socket.emit('end-stream', {
      streamKey: STREAM_ID,
      userId: USER_ID
    });
    
    socket.disconnect();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testStreaming().catch(console.error);
