import * as fs from "fs";
import {
  updateM3U8WithCloudinaryUrls,
  uploadSegmentToCloudinary,
} from "./playlist.manager";

// Track segments being processed to avoid duplicate processing
const processingSegments = new Map<string, Set<number>>();

export const processSegment = async (
  segmentPath: string,
  streamKey: string,
  segmentNumber: number,
  streamType: string,
  playlistPath: string
): Promise<void> => {
  const segmentKey = `${streamKey}-${streamType}`;
  let processing = processingSegments.get(segmentKey) || new Set();

  // If segment is already being processed, skip
  if (processing.has(segmentNumber)) {
    return;
  }

  processing.add(segmentNumber);
  processingSegments.set(segmentKey, processing);

  try {
    // Wait for file to be fully written
    await waitForFile(segmentPath);

    const result = await uploadSegmentToCloudinary(
      segmentPath,
      streamKey,
      segmentNumber,
      streamType
    );

    await updateM3U8WithCloudinaryUrls(
      playlistPath,
      streamKey,
      segmentNumber,
      streamType,
      result.secure_url
    );

    // Only attempt to remove the file if it exists
    if (fs.existsSync(segmentPath)) {
      await fs.promises.unlink(segmentPath);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Error processing segment ${segmentNumber}:`, error);
    }
  } finally {
    // Remove segment from processing set
    processing.delete(segmentNumber);
    if (processing.size === 0) {
      processingSegments.delete(segmentKey);
    }
  }
};

const waitForFile = async (
  filePath: string,
  maxAttempts = 5
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);

      // Additional check for file size and completion
      const stats = await fs.promises.stat(filePath);
      if (stats.size > 0) {
        // Wait a bit more to ensure file is fully written
        await new Promise((resolve) => setTimeout(resolve, 100));
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};
