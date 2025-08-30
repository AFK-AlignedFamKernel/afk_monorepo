# 🎬 Cloudinary Livestreaming Setup Guide

## Overview
This guide explains how to set up Cloudinary for livestreaming in your AFK monorepo data-backend.

## 🚀 **Quick Start**

### 1. **Get Cloudinary Credentials**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Account Details
3. Copy your:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. **Set Environment Variables**
Add these to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=livestream
CLOUDINARY_FOLDER=livestreams

# Backend Configuration
BACKEND_URL=http://localhost:5050
```

### 3. **Install Dependencies**
```bash
cd apps/data-backend
pnpm add cloudinary
```

## 🔧 **How It Works**

### **Stream Creation Flow**
1. **User clicks "Join Event"** → Frontend calls `/livestream/{streamId}/start`
2. **Backend creates Cloudinary stream** → Returns `playbackUrl` and `ingestUrl`
3. **Frontend uses Cloudinary URL** → Video player loads from Cloudinary CDN
4. **Broadcaster connects** → Streams to Cloudinary `ingestUrl`
5. **Viewers watch** → Stream from Cloudinary `playbackUrl`

### **API Endpoints**

#### **Start Stream**
```http
POST /livestream/{streamId}/start
Content-Type: application/json

{
  "streamId": "40a891dff62fe25cb7452a7ae6918237",
  "action": "start",
  "userId": "user123",
  "title": "My Live Stream",
  "description": "Live stream description"
}
```

**Response:**
```json
{
  "status": "created_and_started",
  "streamId": "40a891dff62fe25cb7452a7ae6918237",
  "message": "Stream created and started successfully in Cloudinary",
  "playbackUrl": "https://res.cloudinary.com/your-cloud/video/upload/live/40a891dff62fe25cb7452a7ae6918237",
  "ingestUrl": "rtmp://live.cloudinary.com/live/your-stream-key",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### **Get Stream Status**
```http
GET /livestream/{streamId}/status
```

**Response:**
```json
{
  "streamId": "40a891dff62fe25cb7452a7ae6918237",
  "exists": true,
  "status": "active",
  "cloudinaryStatus": "active",
  "playbackUrl": "https://res.cloudinary.com/your-cloud/video/upload/live/40a891dff62fe25cb7452a7ae6918237",
  "ingestUrl": "rtmp://live.cloudinary.com/live/your-stream-key",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "userId": "user123"
}
```

#### **Get Playback URL**
```http
GET /livestream/{streamId}/playback
```

**Response:**
```json
{
  "streamId": "40a891dff62fe25cb7452a7ae6918237",
  "playbackUrl": "https://res.cloudinary.com/your-cloud/video/upload/live/40a891dff62fe25cb7452a7ae6918237",
  "ingestUrl": "rtmp://live.cloudinary.com/live/your-stream-key",
  "status": "active"
}
```

## 📱 **Frontend Integration**

### **Updated Streaming URL Logic**
The frontend now prioritizes Cloudinary URLs:

1. **WebSocket streaming** (if available)
2. **NIP-53 event streaming URL**
3. **Cloudinary playback URL** (from backend)
4. **Fallback backend URL**

### **Automatic Stream Starting**
When a user joins an event:
1. Frontend calls `/livestream/{streamId}/start`
2. Backend creates/activates Cloudinary stream
3. Returns Cloudinary URLs
4. Frontend uses Cloudinary for playback

## 🎯 **Benefits of Cloudinary**

### **Performance**
- **Global CDN**: Streams served from edge locations worldwide
- **Automatic transcoding**: Multiple quality levels and formats
- **Low latency**: Optimized for live streaming

### **Reliability**
- **99.9% uptime**: Enterprise-grade infrastructure
- **Auto-scaling**: Handles traffic spikes automatically
- **Fallback support**: Multiple delivery methods

### **Features**
- **Auto-recording**: Streams automatically saved
- **Analytics**: Viewer count, engagement metrics
- **Multi-platform**: HLS, DASH, RTMP support

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Stream not found or not started"**
- **Cause**: Stream hasn't been created in Cloudinary yet
- **Solution**: Call `/livestream/{streamId}/start` first

#### **"Missing Cloudinary configuration"**
- **Cause**: Environment variables not set
- **Solution**: Check `.env` file and restart backend

#### **"Failed to create Cloudinary stream"**
- **Cause**: Invalid credentials or API limits
- **Solution**: Verify API keys and check Cloudinary dashboard

### **Debug Commands**
```bash
# Check backend health
curl http://localhost:5050/livestream/health

# List active streams
curl http://localhost:5050/livestream/active

# Check specific stream status
curl http://localhost:5050/livestream/{streamId}/status
```

## 🚀 **Next Steps**

### **Immediate**
1. Set up Cloudinary account and get credentials
2. Add environment variables
3. Test stream creation and playback

### **Advanced Features**
1. **Webhook integration**: Real-time stream status updates
2. **Recording management**: Automatic VOD creation
3. **Analytics dashboard**: Viewer metrics and insights
4. **Multi-quality streams**: Adaptive bitrate streaming

### **Production Considerations**
1. **Rate limiting**: Implement API call throttling
2. **Error handling**: Graceful fallbacks for failures
3. **Monitoring**: Log stream creation/errors
4. **Security**: Validate user permissions before stream creation

## 📚 **Resources**

- [Cloudinary Live Streaming Documentation](https://cloudinary.com/documentation/live_video_streaming)
- [Cloudinary API Reference](https://cloudinary.com/documentation/admin_api)
- [HLS Streaming Guide](https://cloudinary.com/documentation/hls_streaming)
- [RTMP Ingest Guide](https://cloudinary.com/documentation/rtmp_ingest)

---

**Need Help?** Check the console logs for detailed error messages and stream status information.
