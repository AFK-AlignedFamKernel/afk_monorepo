#!/usr/bin/env node

/**
 * HLS Manifest Test
 * 
 * This script tests the HLS manifest and segments for a specific stream:
 * 1. Check if manifest exists
 * 2. Check manifest content
 * 3. Check if segments exist
 * 4. Check segment sizes
 * 5. Validate HLS format
 */

const fs = require('fs');
const path = require('path');

const STREAM_ID = process.argv[2] || 'd0c914f7d474fd3f3cdbb1b50ef434bd';
const BACKEND_URL = 'http://localhost:5050';

console.log('🧪 Starting HLS Manifest Test...');
console.log('📍 Stream ID:', STREAM_ID);
console.log('📍 Backend URL:', BACKEND_URL);

async function testHLSManifest() {
  try {
    // Step 1: Check local manifest file
    console.log('\n📁 Step 1: Checking local manifest file...');
    
    const streamPath = path.join(process.cwd(), '..', '..', '..', 'public', 'livestreams', STREAM_ID);
    const manifestPath = path.join(streamPath, 'stream.m3u8');
    
    console.log('📁 Stream directory:', streamPath);
    console.log('📄 Manifest file:', manifestPath);
    
    if (!fs.existsSync(streamPath)) {
      console.log('❌ Stream directory does not exist');
      return;
    }
    
    if (!fs.existsSync(manifestPath)) {
      console.log('❌ Manifest file does not exist');
      return;
    }
    
    // Step 2: Read manifest content
    console.log('\n📋 Step 2: Reading manifest content...');
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    console.log('📄 Manifest content:');
    console.log('---');
    console.log(manifestContent);
    console.log('---');
    
    // Step 3: Check segments
    console.log('\n🎬 Step 3: Checking HLS segments...');
    
    const files = fs.readdirSync(streamPath);
    const segments = files.filter(file => file.endsWith('.ts'));
    const manifests = files.filter(file => file.endsWith('.m3u8'));
    
    console.log('📁 Directory contents:');
    files.forEach(file => {
      const filePath = path.join(streamPath, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file}: ${stats.size} bytes (${new Date(stats.mtime).toLocaleTimeString()})`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total files: ${files.length}`);
    console.log(`  Segments (.ts): ${segments.length}`);
    console.log(`  Manifests (.m3u8): ${manifests.length}`);
    
    // Step 4: Validate segments
    if (segments.length > 0) {
      console.log('\n🔍 Step 4: Validating segments...');
      
      let totalSize = 0;
      let validSegments = 0;
      
      segments.forEach(segment => {
        const segmentPath = path.join(streamPath, segment);
        const stats = fs.statSync(segmentPath);
        totalSize += stats.size;
        
        if (stats.size > 0) {
          validSegments++;
          console.log(`  ✅ ${segment}: ${stats.size} bytes`);
        } else {
          console.log(`  ❌ ${segment}: 0 bytes (empty)`);
        }
      });
      
      console.log(`\n📊 Segment validation:`);
      console.log(`  Valid segments: ${validSegments}/${segments.length}`);
      console.log(`  Total size: ${totalSize} bytes`);
      console.log(`  Average size: ${Math.round(totalSize / segments.length)} bytes`);
    } else {
      console.log('\n❌ No segments found - this is the problem!');
    }
    
    // Step 5: Test HTTP endpoint
    console.log('\n🌐 Step 5: Testing HTTP endpoint...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/livestream/${STREAM_ID}/stream.m3u8`);
      console.log('📊 HTTP response status:', response.status);
      
      if (response.ok) {
        const httpManifest = await response.text();
        console.log('📄 HTTP manifest content:');
        console.log('---');
        console.log(httpManifest);
        console.log('---');
        
        if (httpManifest === manifestContent) {
          console.log('✅ HTTP manifest matches local file');
        } else {
          console.log('❌ HTTP manifest differs from local file');
        }
      } else {
        console.log('❌ HTTP endpoint failed');
      }
    } catch (error) {
      console.log('❌ HTTP request failed:', error.message);
    }
    
    // Step 6: Recommendations
    console.log('\n💡 Step 6: Recommendations...');
    
    if (segments.length === 0) {
      console.log('🔧 No segments found - possible issues:');
      console.log('  1. FFmpeg is not processing video data');
      console.log('  2. Video data is not being sent via WebSocket');
      console.log('  3. FFmpeg configuration is incorrect');
      console.log('  4. Input stream is not receiving data');
    } else if (validSegments === 0) {
      console.log('🔧 All segments are empty - possible issues:');
      console.log('  1. FFmpeg is not encoding video properly');
      console.log('  2. Input video format is not supported');
      console.log('  3. FFmpeg codec configuration is wrong');
    } else {
      console.log('✅ HLS stream appears to be working correctly');
      console.log('🔧 However, the manifest may be pointing to wrong segments');
      console.log('  1. Check if manifest references the correct segment names');
      console.log('  2. Ensure segments are being generated with consistent naming');
      console.log('  3. Verify FFmpeg is updating the manifest properly');
    }
    
    console.log('\n✅ HLS manifest test completed!');
    
  } catch (error) {
    console.error('❌ HLS manifest test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testHLSManifest().catch(console.error);
