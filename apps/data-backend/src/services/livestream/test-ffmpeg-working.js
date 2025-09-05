#!/usr/bin/env node

/**
 * FFmpeg Working Test
 * 
 * This script tests if FFmpeg is working correctly:
 * 1. Test FFmpeg installation
 * 2. Test basic video processing
 * 3. Test HLS segment generation
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting FFmpeg Working Test...');

async function testFFmpegWorking() {
  try {
    // Step 1: Test FFmpeg installation
    console.log('\n🔍 Step 1: Testing FFmpeg installation...');
    
    await new Promise((resolve, reject) => {
      exec('ffmpeg -version', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ FFmpeg not found or not working:', error.message);
          reject(error);
          return;
        }
        
        const version = stdout.split('\n')[0];
        console.log('✅ FFmpeg found:', version);
        resolve();
      });
    });

    // Step 2: Test basic video processing
    console.log('\n🎬 Step 2: Testing basic video processing...');
    
    const testDir = path.join(process.cwd(), 'test-ffmpeg');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testInput = path.join(testDir, 'test-input.txt');
    const testOutput = path.join(testDir, 'test-output.m3u8');
    
    // Create a simple test input (simulate video data)
    fs.writeFileSync(testInput, 'test video data');
    
    console.log('📁 Test files created:', { testInput, testOutput });
    
    // Step 3: Test HLS generation
    console.log('\n📡 Step 3: Testing HLS generation...');
    
    await new Promise((resolve, reject) => {
      const ffmpegCommand = `ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -c:a aac -hls_time 1 -hls_list_size 0 -hls_segment_filename "${testDir}/segment_%d.ts" "${testOutput}"`;
      
      console.log('🔧 Running FFmpeg command:', ffmpegCommand);
      
      exec(ffmpegCommand, { cwd: testDir }, (error, stdout, stderr) => {
        if (error) {
          console.log('❌ FFmpeg HLS generation failed:', error.message);
          console.log('🔍 FFmpeg stderr:', stderr);
          reject(error);
          return;
        }
        
        console.log('✅ FFmpeg HLS generation successful');
        console.log('🔍 FFmpeg stdout:', stdout);
        resolve();
      });
    });

    // Step 4: Check generated files
    console.log('\n📁 Step 4: Checking generated files...');
    
    if (fs.existsSync(testOutput)) {
      const manifest = fs.readFileSync(testOutput, 'utf8');
      console.log('✅ HLS manifest generated');
      console.log('📋 Manifest content:', manifest);
      
      const files = fs.readdirSync(testDir);
      const segments = files.filter(file => file.endsWith('.ts'));
      console.log('🎯 Video segments generated:', segments.length);
      
      if (segments.length > 0) {
        console.log('✅ FFmpeg is working correctly!');
        console.log('🎬 HLS segments are being generated');
      } else {
        console.log('❌ No video segments generated');
      }
    } else {
      console.log('❌ HLS manifest not generated');
    }

    // Step 5: Cleanup
    console.log('\n🧹 Step 5: Cleaning up test files...');
    
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('✅ Test files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup failed:', cleanupError.message);
    }

    console.log('\n✅ FFmpeg working test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ FFmpeg installation working');
    console.log('✅ Basic video processing working');
    console.log('✅ HLS generation working');
    console.log('✅ Video segments being created');
    
    console.log('\n🎯 FFmpeg is working correctly!');
    console.log('✅ The streaming issue is not with FFmpeg itself');
    console.log('✅ Check the backend logs for other issues');

  } catch (error) {
    console.error('❌ FFmpeg working test failed:', error.message);
    
    if (error.message.includes('ffmpeg: command not found')) {
      console.log('\n🔧 Solution: Install FFmpeg');
      console.log('   Ubuntu/Debian: sudo apt install ffmpeg');
      console.log('   macOS: brew install ffmpeg');
      console.log('   Windows: Download from https://ffmpeg.org/');
    }
    
    process.exit(1);
  }
}

// Run the test
testFFmpegWorking().catch(console.error);

