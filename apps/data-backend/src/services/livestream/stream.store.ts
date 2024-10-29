import path from "path";
import * as fs from "fs";
import { publicDir } from "../..";

export interface SocketStreamDataType {
  streamKey: string;
  userId: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export interface StreamMetadata {
  streamerId: string;
  startTime: number;
  hlsUrl?: string;
  viewers: Set<string>;
  active: boolean;
  uploadStatus?: {
    lastSegment: number;
    failedUploads: Set<number>;
  };
}
export interface SegmentStatus {
  processing: boolean;
  uploaded: boolean;
  retries: number;
  timestamp: any;
}

export interface StreamMetadata {
  streamerId: string;
  startTime: number;
  hlsUrl?: string;
  viewers: Set<string>;
  active: boolean;
  uploadStatus?: {
    lastSegment: number;
    failedUploads: Set<number>;
  };
}

export interface StreamDataType {
  streamKey: string;
  userId: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export interface StreamData {
  cameraHlsUrl?: string;
  screenHlsUrl?: string;
  cameraActive: boolean;
  screenActive: boolean;
  errors: {
    camera?: string;
    screen?: string;
  };
}

const streamStore = new Map<string, StreamData>();

export const initializeStreamData = (streamKey: string): StreamData => {
  const existingData = streamStore.get(streamKey);
  if (!existingData) {
    const newData: StreamData = {
      cameraHlsUrl: undefined,
      screenHlsUrl: undefined,
      cameraActive: false,
      screenActive: false,
      errors: {},
    };
    streamStore.set(streamKey, newData);
    return newData;
  }
  return existingData;
};

export const getStreamStatus = (streamKey: string): StreamData | undefined => {
  return streamStore.get(streamKey);
};
export const cleanupStreamType = async (
  streamKey: string,
  streamType: string
) => {
  const streamData = streamStore.get(streamKey);
  if (streamData) {
    if (streamType === "camera") {
      streamData.cameraActive = false;
      streamData.cameraHlsUrl = undefined;
    } else {
      streamData.screenActive = false;
      streamData.screenHlsUrl = undefined;
    }

    if (!streamData.cameraActive && !streamData.screenActive) {
      streamStore.delete(streamKey);
      const streamPath = path.join(publicDir, "live-streams", streamKey);
      if (fs.existsSync(streamPath)) {
        await fs.promises.rm(streamPath, { recursive: true, force: true });
      }
    } else {
      streamStore.set(streamKey, streamData);
    }
  }
};

export const updateStreamStatus = (
  streamKey: string,
  updates: Partial<StreamData>
): void => {
  const currentData = initializeStreamData(streamKey);
  streamStore.set(streamKey, { ...currentData, ...updates });
};
