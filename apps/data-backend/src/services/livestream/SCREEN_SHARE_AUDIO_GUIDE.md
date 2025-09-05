# Screen Share Audio Guide

## Overview
This guide explains how to properly capture and stream audio from screen sharing in the livestream system.

## Common Issues

### 1. Screen Share Audio Not Captured
**Problem**: Video works but no audio is heard
**Causes**:
- Browser screen share doesn't include audio
- Audio permissions not granted
- Audio input not properly configured

### 2. Audio Format Issues
**Problem**: Audio is captured but not processed correctly
**Causes**:
- Audio codec mismatch
- Sample rate issues
- Audio channel configuration

## Solutions

### For Hosts (Screen Sharing)

#### 1. Enable Audio in Screen Share
When sharing your screen, make sure to:
- ✅ Check "Share audio" or "Include system audio" option
- ✅ Grant microphone permissions if prompted
- ✅ Test audio before starting the stream

#### 2. Browser-Specific Instructions

**Chrome/Edge:**
1. Click "Share screen" button
2. Select the screen/window to share
3. ✅ **IMPORTANT**: Check "Share audio" checkbox
4. Click "Share"

**Firefox:**
1. Click "Share screen" button
2. Select the screen/window to share
3. ✅ **IMPORTANT**: Check "Share audio" checkbox
4. Click "Share"

**Safari:**
1. Click "Share screen" button
2. Select the screen/window to share
3. ✅ **IMPORTANT**: Check "Share audio" checkbox
4. Click "Share"

### For Developers (Backend Configuration)

#### 1. Enhanced FFmpeg Audio Configuration
```typescript
const ffmpegCommand = ffmpeg()
  .input(inputStream)
  .inputFormat("webm")
  .format("hls")
  .videoCodec("libx264")
  .audioCodec("aac")
  .outputOptions([
    // Audio specific settings
    "-acodec", "aac",
    "-ar", "44100",        // Sample rate
    "-ac", "2",            // Stereo audio
    "-b:a", "128k",        // Audio bitrate
    "-af", "aresample=44100", // Resample audio
    
    // Video settings...
  ]);
```

#### 2. Audio Input Validation
```typescript
// Check if audio is present in the input stream
ffmpegCommand.on('stderr', (stderrLine) => {
  if (stderrLine.includes('Audio:')) {
    console.log('🎵 Audio detected:', stderrLine);
  }
  if (stderrLine.includes('No audio')) {
    console.warn('⚠️ No audio detected in input stream');
  }
});
```

#### 3. Audio Stream Monitoring
```typescript
// Monitor audio levels
ffmpegCommand.on('progress', (progress) => {
  if (progress.audio_bitrate) {
    console.log('🎵 Audio bitrate:', progress.audio_bitrate);
  }
});
```

## Testing Audio

### 1. Test Screen Share Audio
```bash
# Test if screen share includes audio
# Open browser dev tools and check:
# 1. MediaStream.getAudioTracks().length > 0
# 2. Audio track is not muted
```

### 2. Test FFmpeg Audio Processing
```bash
# Check FFmpeg logs for audio processing
# Look for:
# - "Audio: aac" in the output
# - Audio bitrate information
# - No "No audio" warnings
```

### 3. Test HLS Audio Playback
```html
<!-- Test audio in HLS player -->
<video id="video" controls autoplay muted>
  <source src="stream.m3u8" type="application/x-mpegURL">
</video>

<script>
// Check if audio tracks are present
video.addEventListener('loadedmetadata', () => {
  console.log('Audio tracks:', video.audioTracks?.length || 0);
  console.log('Video muted:', video.muted);
});
</script>
```

## Troubleshooting

### 1. No Audio in Screen Share
**Check**:
- Browser permissions for microphone
- Screen share settings include audio
- System audio is not muted
- Browser audio is not muted

### 2. Audio Not Processed by FFmpeg
**Check**:
- Input stream contains audio tracks
- FFmpeg audio codec configuration
- Audio format compatibility

### 3. Audio Not Played in HLS
**Check**:
- HLS manifest includes audio
- Video element is not muted
- Browser audio settings
- HLS.js audio handling

## Best Practices

### 1. Host Setup
- Always test audio before going live
- Use headphones to avoid echo
- Check audio levels before sharing
- Inform viewers if audio is not available

### 2. Technical Setup
- Monitor audio bitrate in FFmpeg
- Validate audio tracks in input stream
- Test audio playback in different browsers
- Provide fallback for audio issues

### 3. User Experience
- Show audio status in UI
- Provide audio troubleshooting tips
- Allow users to report audio issues
- Implement audio quality indicators

## Code Examples

### 1. Enhanced StreamVideoPlayer with Audio
```typescript
// Check for audio tracks
video.addEventListener('loadedmetadata', () => {
  const audioTracks = video.audioTracks?.length || 0;
  console.log('Audio tracks available:', audioTracks);
  
  if (audioTracks === 0) {
    console.warn('⚠️ No audio tracks detected');
    // Show warning to user
  }
});
```

### 2. Audio Status Monitoring
```typescript
// Monitor audio levels
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(video);

source.connect(analyser);
analyser.connect(audioContext.destination);

// Check if audio is playing
const checkAudioLevels = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  const hasAudio = dataArray.some(level => level > 0);
  console.log('Audio playing:', hasAudio);
};
```

## Common Browser Issues

### Chrome
- Requires HTTPS for audio capture
- May need user gesture to start audio
- Audio permissions must be granted

### Firefox
- Audio capture works better than Chrome
- May have different audio format
- Requires user interaction

### Safari
- Limited audio capture support
- May need different configuration
- Audio format compatibility issues

## Testing Checklist

- [ ] Screen share includes audio
- [ ] Browser permissions granted
- [ ] FFmpeg processes audio
- [ ] HLS manifest includes audio
- [ ] Video player plays audio
- [ ] Audio quality is acceptable
- [ ] No audio echo or feedback
- [ ] Audio sync with video
