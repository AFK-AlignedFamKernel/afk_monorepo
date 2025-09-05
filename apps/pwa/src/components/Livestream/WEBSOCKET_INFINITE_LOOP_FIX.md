# WebSocket Infinite Loop Fix

## Problem
The WebSocket connection was experiencing infinite loops when used as a host, causing:
- Multiple WebSocket connections being created
- Memory leaks
- Performance issues
- Unstable streaming behavior

## Root Causes

### 1. HostStudio Component (HostStudio.tsx)
**Issue**: `useEffect` dependency array included `connect` and `cleanup` functions
```typescript
// BEFORE (problematic)
useEffect(() => {
  if (streamId) {
    connect(streamId);
  }
  return () => {
    cleanup();
  };
}, [streamId, connect, cleanup]); // ❌ connect and cleanup change on every render
```

**Problem**: `connect` and `cleanup` functions are recreated on every render, causing the effect to run repeatedly.

### 2. StreamVideoPlayer Component (StreamVideoPlayer.tsx)
**Issue**: Multiple `useEffect` hooks with unstable dependencies
```typescript
// BEFORE (problematic)
useEffect(() => {
  // viewer monitoring logic
}, [streamId, isStreamer, joinStream, leaveStream, isLive]); // ❌ Functions and state in deps

useEffect(() => {
  // broadcaster monitoring logic  
}, [streamId, isStreamer, onStreamStart, isLive]); // ❌ Functions and state in deps
```

**Problem**: `joinStream`, `leaveStream`, `onStreamStart`, and `isLive` change frequently, causing effects to run repeatedly.

### 3. WebSocket Context (LivestreamWebSocketContext.tsx)
**Issue**: `cleanup` function had dependencies that changed
```typescript
// BEFORE (problematic)
const cleanup = useCallback(() => {
  if (isStreaming && streamKey) {
    stopStream();
  }
  disconnect();
}, [isStreaming, streamKey, stopStream, disconnect]); // ❌ Dependencies change frequently
```

**Problem**: The cleanup function itself was being recreated, causing components that depend on it to re-render.

## Solutions Applied

### 1. Fixed HostStudio useEffect Dependencies
```typescript
// AFTER (fixed)
useEffect(() => {
  if (streamId) {
    console.log('🔌 Connecting to stream:', streamId);
    setStreamStatus('connecting');
    connect(streamId);
  }

  return () => {
    console.log('🧹 Cleaning up WebSocket connection');
    cleanup();
  };
}, [streamId]); // ✅ Only streamId in dependencies
```

### 2. Fixed StreamVideoPlayer useEffect Dependencies
```typescript
// AFTER (fixed)
useEffect(() => {
  // viewer monitoring logic
}, [streamId, isStreamer]); // ✅ Only stable props in dependencies

useEffect(() => {
  // broadcaster monitoring logic
}, [streamId, isStreamer]); // ✅ Only stable props in dependencies
```

### 3. Stabilized WebSocket Context Cleanup
```typescript
// AFTER (fixed)
const cleanup = useCallback(() => {
  console.log('🧹 WebSocket cleanup called');
  
  // Stop streaming if active
  if (isStreaming && streamKey) {
    if (socketRef.current?.connected) {
      socketRef.current.emit('end-stream', { streamKey });
    }
  }
  
  // Stop MediaRecorder if active
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  }
  
  // Disconnect WebSocket
  if (socketRef.current) {
    socketRef.current.disconnect();
    socketRef.current = null;
  }
  
  // Reset state
  setIsConnected(false);
  setIsStreaming(false);
  setStreamKey(null);
  setViewerCount(0);
}, []); // ✅ No dependencies - stable function
```

## Key Principles Applied

### 1. **Minimal Dependencies**
- Only include values in `useEffect` dependencies that should trigger re-runs
- Avoid including functions that are recreated on every render
- Use refs for values that don't need to trigger re-renders

### 2. **Stable Functions**
- Use `useCallback` with empty dependency arrays for functions that should be stable
- Avoid including frequently changing state in function dependencies

### 3. **Proper Cleanup**
- Ensure cleanup functions are stable and don't cause re-renders
- Use refs to access current values without dependencies

## Testing
To verify the fix:
1. Open HostStudio as a host
2. Check browser console - should see only one "Connecting to stream" message
3. Monitor WebSocket connections in DevTools - should see only one connection
4. Verify no infinite re-renders in React DevTools

## Prevention
- Always review `useEffect` dependency arrays carefully
- Avoid including functions in dependencies unless absolutely necessary
- Use ESLint rules to catch dependency issues
- Test WebSocket connections thoroughly in development
