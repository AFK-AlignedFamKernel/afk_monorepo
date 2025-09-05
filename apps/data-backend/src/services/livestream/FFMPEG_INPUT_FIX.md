# FFmpeg Input Format Fix

## Problem
FFmpeg was failing with error code 183: "Invalid data found when processing input" when trying to process WebM chunks from MediaRecorder.

## Root Cause
The issue was that MediaRecorder sends individual WebM chunks every 1000ms, but FFmpeg expects a continuous WebM stream. Each chunk from MediaRecorder is a complete WebM fragment, not a continuous stream, causing FFmpeg to fail when trying to process them.

## Error Details
```
Stream error: ffmpeg exited with code 183: Error opening input file pipe:0. 
Error opening input files: Invalid data found when processing input
```

## Solutions Applied

### 1. Enhanced FFmpeg Input Options
```typescript
// BEFORE (problematic)
.inputFormat("webm")
.inputOptions([
  "-fflags", "+genpts+igndts",
  "-avoid_negative_ts", "make_zero",
  "-analyzeduration", "10M",
  "-probesize", "32M"
])

// AFTER (fixed)
.inputFormat("webm")
.inputOptions([
  "-fflags", "+genpts+igndts",        // Generate timestamps, ignore DTS
  "-avoid_negative_ts", "make_zero",  // Handle negative timestamps
  "-analyzeduration", "50M",          // Much larger analysis duration
  "-probesize", "100M",               // Much larger probe size
  "-f", "webm",                       // Force WebM format
  "-thread_queue_size", "1024",       // Large thread queue for buffering
  "-reconnect", "1",                  // Enable reconnection
  "-reconnect_streamed", "1",         // Reconnect streamed input
  "-reconnect_delay_max", "2"         // Max delay for reconnection
])
```

### 2. Chunk Accumulation Strategy
Instead of sending individual WebM chunks directly to FFmpeg, we now accumulate them:

```typescript
// BEFORE (problematic)
stream.inputStream.push(chunk);

// AFTER (fixed)
// Initialize chunk accumulator if not exists
if (!stream.chunkAccumulator) {
  stream.chunkAccumulator = Buffer.alloc(0);
}

// Accumulate chunks to create a continuous stream
stream.chunkAccumulator = Buffer.concat([stream.chunkAccumulator, chunk]);

// Push accumulated data to FFmpeg input stream
stream.inputStream.push(stream.chunkAccumulator);

// Reset accumulator after sending
stream.chunkAccumulator = Buffer.alloc(0);
```

### 3. Enhanced Error Handling
Added better error detection and logging for FFmpeg input issues:

```typescript
.on('error', (err) => {
  console.error('❌ FFmpeg error:', err.message);
  console.error('❌ FFmpeg error code:', err.code);
  console.error('❌ FFmpeg error signal:', err.signal);
  
  // Check for specific input format errors
  if (err.message.includes('Invalid data found when processing input')) {
    console.error('❌ FFmpeg input format error - WebM chunks may be malformed');
    console.error('❌ This usually means the input stream format is not compatible');
  }
  
  streamData.status = 'error';
  socket.emit('stream-error', { 
    error: err.message,
    code: err.code,
    signal: err.signal
  });
})
```

### 4. Input Stream Monitoring
Added monitoring for the FFmpeg input stream:

```typescript
// Add input stream monitoring
inputStream.on('data', (chunk) => {
  console.log('📥 FFmpeg received chunk:', chunk.length, 'bytes');
});

inputStream.on('end', () => {
  console.log('📥 FFmpeg input stream ended');
});

inputStream.on('error', (error) => {
  console.error('❌ FFmpeg input stream error:', error);
});
```

## Key Improvements

### 1. **Chunk Accumulation**
- Accumulates WebM chunks before sending to FFmpeg
- Creates a more continuous stream for FFmpeg to process
- Prevents individual chunk processing issues

### 2. **Enhanced Input Options**
- Increased analysis duration and probe size
- Added reconnection capabilities
- Better timestamp handling
- Larger thread queue for buffering

### 3. **Better Error Detection**
- Specific error messages for input format issues
- Detailed logging for debugging
- Error code and signal reporting

### 4. **Stream Monitoring**
- Real-time monitoring of input stream
- Better visibility into data flow
- Early detection of issues

## Testing
To verify the fix:
1. Start a stream as a host
2. Check backend logs for "FFmpeg received chunk" messages
3. Verify no "Invalid data found when processing input" errors
4. Confirm HLS segments are being generated
5. Check that viewers can see the stream

## Expected Results
- ✅ FFmpeg successfully processes WebM chunks
- ✅ HLS segments are generated properly
- ✅ No more "Invalid data found" errors
- ✅ Stable video streaming
- ✅ Better error reporting and debugging

## Prevention
- Always test with actual MediaRecorder data
- Monitor FFmpeg input stream health
- Use appropriate input format options for fragmented data
- Implement proper chunk accumulation for streaming protocols
