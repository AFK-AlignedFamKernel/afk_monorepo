import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary?.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: config.cloudinary?.apiKey || process.env.CLOUDINARY_API_KEY,
  api_secret: config.cloudinary?.apiSecret || process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryStream {
  streamId: string;
  userId: string;
  playbackUrl: string;
  streamUrl: string;
  status: 'created' | 'active' | 'inactive' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStreamOptions {
  streamId: string;
  userId: string;
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Cloudinary Livestream Service
 * Handles creation, management, and monitoring of live streams
 */
export class CloudinaryLivestreamService {
  private static instance: CloudinaryLivestreamService;
  private activeStreams: Map<string, CloudinaryStream> = new Map();

  static getInstance(): CloudinaryLivestreamService {
    if (!CloudinaryLivestreamService.instance) {
      CloudinaryLivestreamService.instance = new CloudinaryLivestreamService();
    }
    return CloudinaryLivestreamService.instance;
  }

  /**
   * Create a new livestream
   */
  async createStream(options: CreateStreamOptions): Promise<CloudinaryStream> {
    try {
      console.log(`🎬 Creating Cloudinary stream: ${options.streamId}`);

      // Create stream using Cloudinary API
      const result = await cloudinary.api.create_stream({
        name: options.streamId,
        title: options.title || `Live Stream ${options.streamId}`,
        description: options.description || 'Live stream created via API',
        tags: options.tags || ['livestream', 'live'],
        mode: 'live',
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5050'}/livestream/webhook`,
        auto_record: true,
        recording_notification_url: `${process.env.BACKEND_URL || 'http://localhost:5050'}/livestream/recording-webhook`,
      });

      console.log('✅ Cloudinary stream created:', result);

      // Create stream object
      const stream: CloudinaryStream = {
        streamId: options.streamId,
        userId: options.userId,
        playbackUrl: result.playback_url,
        streamUrl: result.ingest_url,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in memory
      this.activeStreams.set(options.streamId, stream);

      console.log(`🎯 Stream ${options.streamId} ready for broadcasting`);
      console.log(`📡 Ingest URL: ${stream.streamUrl}`);
      console.log(`📺 Playback URL: ${stream.playbackUrl}`);

      return stream;

    } catch (error) {
      console.error('❌ Failed to create Cloudinary stream:', error);
      throw new Error(`Failed to create stream: ${error.message}`);
    }
  }

  /**
   * Get stream information
   */
  async getStream(streamId: string): Promise<CloudinaryStream | null> {
    try {
      // Check local cache first
      const localStream = this.activeStreams.get(streamId);
      if (localStream) {
        return localStream;
      }

      // Fetch from Cloudinary API
      const result = await cloudinary.api.get_stream(streamId);
      
      if (result) {
        const stream: CloudinaryStream = {
          streamId: streamId,
          userId: result.user_id || 'unknown',
          playbackUrl: result.playback_url,
          streamUrl: result.ingest_url,
          status: result.status || 'inactive',
          createdAt: new Date(result.created_at),
          updatedAt: new Date(result.updated_at || result.created_at),
        };

        // Cache locally
        this.activeStreams.set(streamId, stream);
        return stream;
      }

      return null;

    } catch (error) {
      console.error(`❌ Failed to get stream ${streamId}:`, error);
      return null;
    }
  }

  /**
   * Start a stream (mark as active)
   */
  async startStream(streamId: string): Promise<CloudinaryStream | null> {
    try {
      console.log(`🚀 Starting Cloudinary stream: ${streamId}`);

      const stream = await this.getStream(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Update status to active
      stream.status = 'active';
      stream.updatedAt = new Date();
      this.activeStreams.set(streamId, stream);

      console.log(`✅ Stream ${streamId} marked as active`);
      return stream;

    } catch (error) {
      console.error(`❌ Failed to start stream ${streamId}:`, error);
      return null;
    }
  }

  /**
   * Stop a stream
   */
  async stopStream(streamId: string): Promise<boolean> {
    try {
      console.log(`⏹️ Stopping Cloudinary stream: ${streamId}`);

      const stream = this.activeStreams.get(streamId);
      if (stream) {
        stream.status = 'inactive';
        stream.updatedAt = new Date();
        this.activeStreams.set(streamId, stream);
      }

      // Optionally delete from Cloudinary (uncomment if you want to remove completely)
      // await cloudinary.api.delete_stream(streamId);

      console.log(`✅ Stream ${streamId} stopped`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to stop stream ${streamId}:`, error);
      return false;
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(streamId: string): Promise<any> {
    try {
      const stream = await this.getStream(streamId);
      
      if (!stream) {
        return {
          streamId,
          exists: false,
          status: 'not_found'
        };
      }

      // Get real-time status from Cloudinary
      const cloudinaryStatus = await cloudinary.api.get_stream_status(streamId);
      
      return {
        streamId,
        exists: true,
        status: stream.status,
        cloudinaryStatus: cloudinaryStatus?.status || 'unknown',
        playbackUrl: stream.playbackUrl,
        streamUrl: stream.streamUrl,
        createdAt: stream.createdAt,
        updatedAt: stream.updatedAt,
        userId: stream.userId
      };

    } catch (error) {
      console.error(`❌ Failed to get stream status for ${streamId}:`, error);
      return {
        streamId,
        exists: false,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * List all active streams
   */
  async listActiveStreams(): Promise<CloudinaryStream[]> {
    try {
      const streams = Array.from(this.activeStreams.values());
      return streams.filter(stream => stream.status === 'active');
    } catch (error) {
      console.error('❌ Failed to list active streams:', error);
      return [];
    }
  }

  /**
   * Delete a stream
   */
  async deleteStream(streamId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting Cloudinary stream: ${streamId}`);

      // Remove from local cache
      this.activeStreams.delete(streamId);

      // Delete from Cloudinary
      await cloudinary.api.delete_stream(streamId);

      console.log(`✅ Stream ${streamId} deleted`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to delete stream ${streamId}:`, error);
      return false;
    }
  }

  /**
   * Get playback URL for a stream
   */
  getPlaybackUrl(streamId: string): string | null {
    const stream = this.activeStreams.get(streamId);
    return stream?.playbackUrl || null;
  }

  /**
   * Get ingest URL for broadcasting
   */
  getIngestUrl(streamId: string): string | null {
    const stream = this.activeStreams.get(streamId);
    return stream?.streamUrl || null;
  }
}

// Export singleton instance
export const cloudinaryLivestreamService = CloudinaryLivestreamService.getInstance();
