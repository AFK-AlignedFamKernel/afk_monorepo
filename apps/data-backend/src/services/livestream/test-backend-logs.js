#!/usr/bin/env node

/**
 * Backend Logs Test
 * 
 * This script tests the backend and checks for any errors:
 * 1. Test basic HTTP endpoints
 * 2. Check if backend is responding
 * 3. Look for any error messages
 */

const BACKEND_URL = 'http://localhost:5050';

console.log('🧪 Starting Backend Logs Test...');
console.log('📍 Backend URL:', BACKEND_URL);

async function testBackendLogs() {
  try {
    // Step 1: Test basic connectivity
    console.log('\n🔌 Step 1: Testing basic connectivity...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      console.log('📊 Health endpoint response:', response.status);
      if (response.ok) {
        const health = await response.text();
        console.log('✅ Backend is responding');
      }
    } catch (error) {
      console.log('⚠️ Health endpoint not available, trying other endpoints');
    }

    // Step 2: Test livestream endpoints
    console.log('\n🎬 Step 2: Testing livestream endpoints...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/test-endpoint/status`);
      console.log('📊 Livestream status endpoint response:', response.status);
      
      if (response.ok) {
        const status = await response.text();
        console.log('✅ Livestream endpoints are working');
      } else {
        console.log('❌ Livestream endpoints are not working');
      }
    } catch (error) {
      console.log('❌ Error testing livestream endpoints:', error.message);
    }

    // Step 3: Test WebSocket endpoint
    console.log('\n🔌 Step 3: Testing WebSocket endpoint...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/socket.io/`);
      console.log('📊 Socket.IO endpoint response:', response.status);
      
      if (response.ok) {
        console.log('✅ Socket.IO endpoint is accessible');
      } else {
        console.log('❌ Socket.IO endpoint is not accessible');
      }
    } catch (error) {
      console.log('❌ Error testing Socket.IO endpoint:', error.message);
    }

    // Step 4: Check for any debug endpoints
    console.log('\n🐛 Step 4: Checking for debug endpoints...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/debug/streams`);
      console.log('📊 Debug streams endpoint response:', response.status);
      
      if (response.ok) {
        const debug = await response.json();
        console.log('📊 Active streams:', debug);
      } else {
        console.log('⚠️ Debug endpoint not available');
      }
    } catch (error) {
      console.log('⚠️ Debug endpoint not available:', error.message);
    }

    // Step 5: Test a simple stream creation
    console.log('\n🎬 Step 5: Testing simple stream creation...');
    
    const testStreamId = 'test-backend-logs-' + Date.now();
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${testStreamId}/stream.m3u8`);
      console.log('📊 Stream creation response:', response.status);
      
      if (response.ok) {
        const manifest = await response.text();
        console.log('✅ Stream created successfully');
        console.log('📋 Manifest content length:', manifest.length);
      } else {
        console.log('❌ Stream creation failed');
      }
    } catch (error) {
      console.log('❌ Error creating test stream:', error.message);
    }

    console.log('\n✅ Backend logs test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Basic connectivity tested');
    console.log('✅ Livestream endpoints tested');
    console.log('✅ WebSocket endpoints tested');
    console.log('✅ Debug endpoints tested');
    console.log('✅ Stream creation tested');
    
    console.log('\n🎯 If all tests pass, the backend should be working correctly.');
    console.log('⚠️ If any tests fail, check the backend logs for errors.');

  } catch (error) {
    console.error('❌ Backend logs test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testBackendLogs().catch(console.error);
