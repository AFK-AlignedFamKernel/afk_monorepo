# HLS Manifest Infinite Loop Fix

## Problem
The HLS manifest generation was causing an infinite loop with the following symptoms:
- `EXT-X-DISCONTINUITY` tags being added repeatedly
- File watcher triggering continuously
- Manifest content being updated in a loop without actual segments

## Root Cause
The issue was in the `validateAndFixManifest` function in `streamService.ts`:

1. **Initial manifest** was created with `EXT-X-DISCONTINUITY` but no actual segments
2. **File watcher** detected the manifest change and called `validateAndFixManifest`
3. **validateAndFixManifest** saw no `.ts` segments and added more `EXT-X-DISCONTINUITY` tags
4. **Writing the file** triggered the file watcher again
5. **Infinite loop** occurred

## Solution Applied

### 1. Fixed validateAndFixManifest Function
- **Before**: Added placeholder `EXT-X-DISCONTINUITY` tags when no segments existed
- **After**: Only logs a message and waits for actual segments from FFmpeg
- **Result**: Prevents writing placeholder content that triggers file watcher

### 2. Removed EXT-X-DISCONTINUITY from Initial Manifest
- **Before**: Initial manifest included `EXT-X-DISCONTINUITY` tag
- **After**: Clean initial manifest without placeholder tags
- **Result**: Prevents initial trigger of validation loop

### 3. Added Debouncing to File Watcher
- **Before**: Immediate validation on every manifest change
- **After**: 1-second debounce timeout before validation
- **Result**: Prevents rapid successive validation calls

### 4. Reduced Periodic Check Frequency
- **Before**: Manifest validation every 5 seconds
- **After**: Manifest validation every 30 seconds
- **Result**: Reduces unnecessary validation calls

## Code Changes

```typescript
// Before (problematic)
if (segments.length === 0) {
  console.log('⚠️ Manifest has no segments, adding placeholder...');
  const linesWithPlaceholder = content.split('\n');
  linesWithPlaceholder.push('#EXTINF:2.0,');
  linesWithPlaceholder.push('#EXT-X-DISCONTINUITY');
  await writeFile(manifestPath, linesWithPlaceholder.join('\n'), 'utf8');
}

// After (fixed)
if (segments.length === 0) {
  console.log('⚠️ Manifest has no segments, waiting for FFmpeg to generate them...');
  // Don't add placeholder content - this causes infinite loops
  // Just log and wait for actual segments from FFmpeg
}
```

## Testing
To test the fix:
1. Start a new stream
2. Monitor the logs for manifest updates
3. Verify no infinite loop occurs
4. Confirm segments are properly added when FFmpeg generates them

## Prevention
- Never add placeholder content to HLS manifests that could trigger file watchers
- Use debouncing for file system operations
- Only validate manifests when necessary
- Let FFmpeg handle segment generation naturally
