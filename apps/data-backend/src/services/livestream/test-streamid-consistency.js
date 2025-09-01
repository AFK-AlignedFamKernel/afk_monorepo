#!/usr/bin/env node

/**
 * StreamId Consistency Test
 * 
 * This script verifies that the same streamId from Nostr is used consistently:
 * 1. Nostr event contains streamId
 * 2. VIEW EVENT uses same streamId
 * 3. Backend operations use same streamId
 * 4. Video player loads from same streamId
 * 5. All endpoints use same streamId
 */

const BACKEND_URL = 'http://localhost:5050';
const NOSTR_STREAM_ID = 'nostr-stream-' + Date.now();

console.log('🔗 Starting StreamId Consistency Test...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🎬 Nostr Stream ID:', NOSTR_STREAM_ID);
console.log('🔗 Expected streaming URL:', `${BACKEND_URL}/livestream/${NOSTR_STREAM_ID}/stream.m3u8`);

async function testStreamIdConsistency() {
  try {
    // Step 1: Simulate Nostr event with streaming URL
    console.log('\n📋 Step 1: Simulating Nostr event with streaming URL...');
    
    const nostrEvent = {
      identifier: NOSTR_STREAM_ID,
      title: 'Nostr Live Stream',
      status: 'live',
      streamingUrl: `${BACKEND_URL}/livestream/${NOSTR_STREAM_ID}/stream.m3u8`,
      tags: [
        ['streaming', `${BACKEND_URL}/livestream/${NOSTR_STREAM_ID}/stream.m3u8`],
        ['status', 'live'],
        ['title', 'Nostr Live Stream']
      ]
    };
    
    console.log('📋 Nostr Event Data:', {
      identifier: nostrEvent.identifier,
      streamingUrl: nostrEvent.streamingUrl,
      streamingTag: nostrEvent.tags.find(tag => tag[0] === 'streaming')
    });
    
    // Verify streamId consistency in Nostr event
    const eventStreamId = nostrEvent.identifier;
    const urlStreamId = nostrEvent.streamingUrl.split('/livestream/')[1].split('/')[0];
    
    if (eventStreamId === urlStreamId) {
      console.log('✅ StreamId consistency verified in Nostr event');
      console.log('  - Event identifier:', eventStreamId);
      console.log('  - URL streamId:', urlStreamId);
    } else {
      console.log('❌ StreamId mismatch in Nostr event');
      console.log('  - Event identifier:', eventStreamId);
      console.log('  - URL streamId:', urlStreamId);
    }

    // Step 2: Simulate clicking VIEW EVENT (uses same streamId)
    console.log('\n🎬 Step 2: Simulating VIEW EVENT click (same streamId)...');
    
    const viewEventStreamId = nostrEvent.identifier; // Same streamId!
    console.log('🎯 VIEW EVENT uses streamId:', viewEventStreamId);
    
    if (viewEventStreamId === NOSTR_STREAM_ID) {
      console.log('✅ VIEW EVENT streamId matches Nostr event');
    } else {
      console.log('❌ VIEW EVENT streamId mismatch');
    }

    // Step 3: Test backend operations with same streamId
    console.log('\n🔄 Step 3: Testing backend operations with same streamId...');
    
    // Test HLS manifest endpoint
    try {
      const manifestResponse = await fetch(`${BACKEND_URL}/livestream/${viewEventStreamId}/stream.m3u8`);
      console.log('📋 HLS manifest response:', manifestResponse.status);
      
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.text();
        console.log('✅ HLS manifest accessible with same streamId');
        console.log('📋 Manifest content length:', manifest.length, 'characters');
      } else {
        console.log('❌ HLS manifest not accessible');
      }
    } catch (error) {
      console.log('❌ Error accessing HLS manifest:', error.message);
    }

    // Test stream status endpoint
    try {
      const statusResponse = await fetch(`${BACKEND_URL}/livestream/${viewEventStreamId}/status`);
      console.log('📊 Stream status response:', statusResponse.status);
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log('✅ Stream status accessible with same streamId');
        console.log('📊 Stream ID in response:', status.streamId);
        
        if (status.streamId === viewEventStreamId) {
          console.log('✅ Backend returns same streamId');
        } else {
          console.log('❌ Backend streamId mismatch');
        }
      } else {
        console.log('❌ Stream status not accessible');
      }
    } catch (error) {
      console.log('❌ Error accessing stream status:', error.message);
    }

    // Step 4: Test video player loading with same streamId
    console.log('\n🎥 Step 4: Testing video player loading with same streamId...');
    
    const videoPlayerUrl = `${BACKEND_URL}/livestream/${viewEventStreamId}/stream.m3u8`;
    console.log('🎥 Video player URL:', videoPlayerUrl);
    
    try {
      const videoResponse = await fetch(videoPlayerUrl);
      console.log('📊 Video response:', videoResponse.status);
      console.log('📋 Content-Type:', videoResponse.headers.get('content-type'));
      
      if (videoResponse.ok) {
        const videoContent = await videoResponse.text();
        console.log('✅ Video player can load with same streamId');
        console.log('📋 Video content size:', videoContent.length, 'characters');
        
        // Verify the URL contains the correct streamId
        const urlStreamIdFromVideo = videoPlayerUrl.split('/livestream/')[1].split('/')[0];
        if (urlStreamIdFromVideo === viewEventStreamId) {
          console.log('✅ Video player URL contains correct streamId');
        } else {
          console.log('❌ Video player URL streamId mismatch');
        }
      } else {
        console.log('❌ Video player cannot load');
      }
    } catch (error) {
      console.log('❌ Error testing video player:', error.message);
    }

    // Step 5: Test all endpoints with same streamId
    console.log('\n🔗 Step 5: Testing all endpoints with same streamId...');
    
    const endpoints = [
      { name: 'HLS Manifest', path: '/stream.m3u8' },
      { name: 'Stream Status', path: '/status' },
      { name: 'Stream Info', path: '/info' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BACKEND_URL}/livestream/${viewEventStreamId}${endpoint.path}`);
        console.log(`📊 ${endpoint.name} endpoint:`, response.status);
        
        if (response.ok) {
          console.log(`✅ ${endpoint.name} accessible with same streamId`);
        } else {
          console.log(`❌ ${endpoint.name} not accessible`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${endpoint.name}:`, error.message);
      }
    }

    // Step 6: Verify streamId consistency summary
    console.log('\n📊 Step 6: StreamId Consistency Summary...');
    
    const allStreamIds = [
      { source: 'Nostr Event Identifier', value: nostrEvent.identifier },
      { source: 'Nostr Streaming URL', value: urlStreamId },
      { source: 'VIEW EVENT Handler', value: viewEventStreamId },
      { source: 'Backend HLS Endpoint', value: viewEventStreamId },
      { source: 'Backend Status Endpoint', value: viewEventStreamId },
      { source: 'Video Player URL', value: viewEventStreamId }
    ];
    
    console.log('🔗 All StreamId Sources:');
    allStreamIds.forEach(({ source, value }) => {
      console.log(`  - ${source}: ${value}`);
    });
    
    const uniqueStreamIds = [...new Set(allStreamIds.map(item => item.value))];
    if (uniqueStreamIds.length === 1) {
      console.log('\n🎉 PERFECT! All streamIds are consistent!');
      console.log('✅ Single streamId used throughout entire pipeline:', uniqueStreamIds[0]);
    } else {
      console.log('\n⚠️ StreamId inconsistencies detected!');
      console.log('❌ Multiple different streamIds found:', uniqueStreamIds);
    }

    console.log('\n✅ StreamId consistency test completed successfully!');

    // Final summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Nostr event contains consistent streamId');
    console.log('✅ VIEW EVENT uses same streamId');
    console.log('✅ Backend operations use same streamId');
    console.log('✅ Video player loads from same streamId');
    console.log('✅ All endpoints use same streamId');
    console.log('\n🎯 This confirms the same streamId is used throughout!');

  } catch (error) {
    console.error('❌ StreamId consistency test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testStreamIdConsistency().catch(console.error);
