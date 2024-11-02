import * as fs from "fs";
import { retryOperation } from "./util";
import cloudinary from "../../config";

// Store all segments for each stream type
const streamSegments = new Map<string, Map<number, string>>();

export async function updateM3U8WithCloudinaryUrls(
  m3u8Path: string,
  streamKey: string,
  latestSegmentNumber: number,
  streamType: string,
  segmentUrl: string
): Promise<void> {
  const tempPath = `${m3u8Path}.tmp`;
  const streamId = `${streamKey}-${streamType}`;

  try {
    // Initialize or get segments map for this stream
    let segments = streamSegments.get(streamId);
    if (!segments) {
      segments = new Map<number, string>();
      streamSegments.set(streamId, segments);
    }

    // Add new segment URL to the map
    segments.set(latestSegmentNumber, segmentUrl);

    // Read existing content or create base structure
    let content = "";
    if (fs.existsSync(m3u8Path)) {
      content = fs.readFileSync(m3u8Path, "utf8");
    } else {
      content =
        "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n";
    }

    // Parse existing content to get EXTINF values
    const lines = content.split("\n");
    const existingExtinfs = new Map<number, string>();
    const mediaSequenceMatch = content.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
    const currentMediaSequence = mediaSequenceMatch
      ? parseInt(mediaSequenceMatch[1], 10)
      : 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("#EXTINF:")) {
        const nextLine = lines[i + 1];
        if (nextLine) {
          const segmentMatch = nextLine.match(/segment_(\d+)\.ts$/);
          if (segmentMatch) {
            const segmentNumber = parseInt(segmentMatch[1], 10);
            existingExtinfs.set(segmentNumber, line);
          }
        }
      }
    }

    // Create header
    let updatedContent =
      "#EXTM3U\n" +
      "#EXT-X-VERSION:3\n" +
      "#EXT-X-TARGETDURATION:10\n" +
      `#EXT-X-MEDIA-SEQUENCE:${currentMediaSequence}\n`;

    // Add all segments in order
    const orderedSegments = Array.from(segments.keys()).sort((a, b) => a - b);

    for (const segmentNumber of orderedSegments) {
      const segmentUrl = segments.get(segmentNumber);
      if (segmentUrl) {
        const extinf = existingExtinfs.get(segmentNumber) || "#EXTINF:2.0,";
        updatedContent += `${extinf}\n${segmentUrl}\n`;
      }
    }

    // Write to temp file and rename atomically
    await fs.promises.writeFile(tempPath, updatedContent);
    await fs.promises.rename(tempPath, m3u8Path);

    // Upload to Cloudinary
    await uploadPlaylistToCloudinary(m3u8Path, streamKey, streamType);
  } catch (error) {
    console.error(`Error updating M3U8 for ${streamKey}/${streamType}:`, error);
    if (fs.existsSync(tempPath)) {
      try {
        await fs.promises.unlink(tempPath);
      } catch (cleanupError) {
        console.error("Failed to clean up temporary M3U8 file:", cleanupError);
      }
    }
    throw error;
  }
}

async function uploadPlaylistToCloudinary(
  m3u8Path: string,
  streamKey: string,
  streamType: string
): Promise<void> {
  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: `live-streams/${streamKey}/${streamType}/playlist`,
        resource_type: "raw",
        folder: "live-streams",
        format: "m3u8",
        use_filename: true,
        type: "upload",
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readStream = fs.createReadStream(m3u8Path);
    readStream.on("error", (error) => {
      uploadStream.destroy();
      reject(error);
    });

    readStream.pipe(uploadStream);
  });
}

export async function uploadSegmentToCloudinary(
  segmentPath: string,
  streamKey: string,
  segmentNumber: number,
  folder: string
): Promise<any> {
  const uploadOperation = () =>
    new Promise((resolve, reject) => {
      if (!fs.existsSync(segmentPath)) {
        reject(new Error(`Segment file not found: ${segmentPath}`));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `live-streams/${streamKey}/${folder}/segment_${String(
            segmentNumber
          ).padStart(3, "0")}`,
          resource_type: "video",
          folder: "live-streams",
          use_filename: true,
          format: "ts",
          type: "upload",
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload failed:", error);
            reject(error);
            return;
          }
          resolve(result);
        }
      );

      const readStream = fs.createReadStream(segmentPath);
      readStream.on("error", (error) => {
        uploadStream.destroy();
        reject(error);
      });

      readStream.pipe(uploadStream);
    });

  const result = await retryOperation(uploadOperation);

  // Only delete after successful upload
  try {
    if (fs.existsSync(segmentPath)) {
      fs.unlinkSync(segmentPath);
    }
  } catch (error) {
    console.error(`Failed to delete segment ${segmentPath}:`, error);
    // Continue execution as this is not critical
  }

  return result;
}

export function clearStreamSegments(
  streamKey: string,
  streamType: string
): void {
  streamSegments.delete(`${streamKey}-${streamType}`);
}
