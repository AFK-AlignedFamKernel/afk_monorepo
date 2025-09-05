import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary?.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: config.cloudinary?.api_key || process.env.CLOUDINARY_API_KEY,
  api_secret: config.cloudinary?.api_secret || process.env.CLOUDINARY_API_SECRET,
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
 * 
 * Note: Cloudinary v2 doesn't have built-in livestream API methods.
 * This service simulates livestream functionality using local state management
 * and provides endpoints for testing purposes.
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
   * Create a new livestream (simulated)
   * Since Cloudinary v2 doesn't support livestreams, we create a mock stream
   */
  async createStream(options: CreateStreamOptions): Promise<CloudinaryStream> {
    try {
      console.log(`🎬 Creating simulated Cloudinary stream: ${options.streamId}`);

      // Generate mock URLs for testing
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5050';
      const streamUrl = `${backendUrl}/livestream/${options.streamId}/ingest`;
      const playbackUrl = `${backendUrl}/livestream/${options.streamId}/stream.m3u8`;

      // Create stream object
      const stream: CloudinaryStream = {
        streamId: options.streamId,
        userId: options.userId,
        playbackUrl,
        streamUrl,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in memory
      this.activeStreams.set(options.streamId, stream);

      console.log(`🎯 Simulated stream ${options.streamId} ready for broadcasting`);
      console.log(`📡 Ingest URL: ${stream.streamUrl}`);
      console.log(`📺 Playback URL: ${stream.playbackUrl}`);
      console.log(`⚠️ Note: This is a simulated stream for testing purposes`);

      return stream;

    } catch (error) {
      console.error('❌ Failed to create simulated Cloudinary stream:', error);
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

      console.log(`🔍 Stream ${streamId} not found in local cache`);
      return null;

    } catch (error) {
      console.error('❌ Failed to get stream:', error);
      return null;
    }
  }

  /**
   * Start a stream (simulated)
   */
  async startStream(streamId: string): Promise<CloudinaryStream | null> {
    try {
      console.log(`🎬 Starting simulated stream: ${streamId}`);

      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        console.warn(`⚠️ Stream ${streamId} not found, cannot start`);
        return null;
      }

      // Update status to active
      stream.status = 'active';
      stream.updatedAt = new Date();

      console.log(`✅ Stream ${streamId} started successfully`);
      return stream;

    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      return null;
    }
  }

  /**
   * Stop a stream (simulated)
   */
  async stopStream(streamId: string): Promise<boolean> {
    try {
      console.log(`⏹️ Stopping simulated stream: ${streamId}`);

      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        console.warn(`⚠️ Stream ${streamId} not found, cannot stop`);
        return false;
      }

      // Update status to inactive
      stream.status = 'inactive';
      stream.updatedAt = new Date();

      console.log(`✅ Stream ${streamId} stopped successfully`);
      return true;

    } catch (error) {
      console.error('❌ Failed to stop stream:', error);
      return false;
    }
  }

  /**
   * Get stream status (simulated)
   */
  async getStreamStatus(streamId: string): Promise<any> {
    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        return {
          status: 'not_found',
          message: 'Stream not found'
        };
      }

      return {
        status: stream.status,
        streamId: stream.streamId,
        userId: stream.userId,
        createdAt: stream.createdAt,
        updatedAt: stream.updatedAt,
        isActive: stream.status === 'active'
      };

    } catch (error) {
      console.error('❌ Failed to get stream status:', error);
      return {
        status: 'error',
        message: 'Failed to get stream status'
      };
    }
  }

  /**
   * List all active streams
   */
  async listStreams(): Promise<CloudinaryStream[]> {
    try {
      const streams = Array.from(this.activeStreams.values());
      console.log(`📋 Found ${streams.length} streams`);
      return streams;
    } catch (error) {
      console.error('❌ Failed to list streams:', error);
      return [];
    }
  }

  /**
   * Delete a stream (simulated)
   */
  async deleteStream(streamId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting simulated stream: ${streamId}`);

      const deleted = this.activeStreams.delete(streamId);
      if (deleted) {
        console.log(`✅ Stream ${streamId} deleted successfully`);
        return true;
      } else {
        console.warn(`⚠️ Stream ${streamId} not found, cannot delete`);
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to delete stream:', error);
      return false;
    }
  }

  /**
   * Get all streams for a user
   */
  async getUserStreams(userId: string): Promise<CloudinaryStream[]> {
    try {
      const userStreams = Array.from(this.activeStreams.values())
        .filter(stream => stream.userId === userId);
      
      console.log(`👤 Found ${userStreams.length} streams for user ${userId}`);
      return userStreams;

    } catch (error) {
      console.error('❌ Failed to get user streams:', error);
      return [];
    }
  }

  /**
   * Update stream metadata
   */
  async updateStream(streamId: string, updates: Partial<CloudinaryStream>): Promise<CloudinaryStream | null> {
    try {
      console.log(`✏️ Updating stream: ${streamId}`);

      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        console.warn(`⚠️ Stream ${streamId} not found, cannot update`);
        return null;
      }

      // Update fields
      Object.assign(stream, updates);
      stream.updatedAt = new Date();

      console.log(`✅ Stream ${streamId} updated successfully`);
      return stream;

    } catch (error) {
      console.error('❌ Failed to update stream:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cloudinaryLivestreamService = CloudinaryLivestreamService.getInstance();
