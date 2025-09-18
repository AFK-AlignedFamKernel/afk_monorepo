# 🎬 OBS Studio Integration Guide

## Overview
The HostStudio component now supports two streaming modes:
1. **Direct Capture** - Use camera/microphone directly in the browser
2. **OBS Studio** - Use OBS Studio with RTMP backend for professional streaming

## 🚀 How to Use OBS Mode

### 1. **Select OBS Mode**
- In the HostStudio interface, click on "OBS Studio" mode
- This will show the OBS configuration section

### 2. **Generate Stream Key**
- Click "Generate Stream Key" button
- The system will create a unique stream key and RTMP URL
- Both values will be displayed with copy buttons

### 3. **Configure OBS Studio**
1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. Set **Service** to "Custom"
4. Paste the **RTMP URL** from the interface
5. Paste the **Stream Key** from the interface
6. Click **OK**

### 4. **Start Streaming**
- In OBS Studio, click **Start Streaming**
- In the HostStudio interface, click **Go Live**
- Your OBS stream will be broadcast through the platform

## 🔧 Technical Details

### Backend Endpoint
```
POST /livestream/{streamId}/rtmp-key
Content-Type: application/json

{
  "publicKey": "user_public_key"
}
```

**Response:**
```json
{
  "streamId": "stream_id",
  "streamKey": "unique_stream_key",
  "rtmpUrl": "rtmp://localhost:1935/live/unique_stream_key",
  "message": "RTMP stream key generated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Environment Variables
Add to your backend `.env` file:
```bash
RTMP_HOST=rtmp://localhost:1935/live
```

### Stream Key Format
Stream keys are generated in the format:
```
{streamId}-{timestamp}-{randomString}
```

## 🎯 Features

### ✅ Implemented
- [x] Streaming mode selector (Direct vs OBS)
- [x] Stream key generation
- [x] RTMP URL configuration
- [x] Copy to clipboard functionality
- [x] OBS setup instructions
- [x] Responsive design for mobile/tablet
- [x] Backend endpoint for key generation

### 🔄 How It Works
1. **User selects OBS mode** → UI shows OBS configuration
2. **User clicks "Generate Stream Key"** → Backend creates unique key
3. **User configures OBS** → Uses provided RTMP URL and stream key
4. **User starts streaming in OBS** → Stream flows to backend
5. **User clicks "Go Live"** → Backend starts processing the stream
6. **Viewers can watch** → Stream is available via HLS

## 📱 Mobile Support
The OBS configuration is fully responsive and works on mobile devices:
- Mode selector adapts to vertical layout
- Configuration inputs stack vertically
- Copy buttons are touch-friendly
- Instructions are readable on small screens

## 🐛 Troubleshooting

### Common Issues
1. **Stream key not generating** → Check backend connection
2. **OBS can't connect** → Verify RTMP URL and stream key
3. **Stream not appearing** → Check if backend is processing the stream
4. **Mobile layout issues** → Ensure responsive CSS is loaded

### Debug Steps
1. Check browser console for errors
2. Verify backend endpoint is accessible
3. Test RTMP connection in OBS
4. Check stream status in backend logs
