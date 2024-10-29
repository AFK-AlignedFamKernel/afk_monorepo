import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";

export const setupFFmpegCommand = async (
  streamKey: string,
  streamType: string,
  outputPath: string,
  streamOutputPath: string,
  processSegment: Function
): Promise<ffmpeg.FfmpegCommand> => {
  const ffmpegCommand = ffmpeg()
    .input("pipe:0")
    .inputOptions([
      "-f webm",
      "-threads 4",
      "-re",
      "-err_detect ignore_err",
      "-fflags +genpts", // Generate presentation timestamps
    ])
    .outputOptions([
      "-c:v libx264",
      "-preset ultrafast",
      "-tune zerolatency",
      "-profile:v baseline",
      "-level 3.0",
      "-pix_fmt yuv420p",
      "-r 30",
      "-g 60",
      "-bufsize 6000k",
      "-maxrate 2500k",
      "-crf 28",
      "-f hls",
      "-hls_time 5",
      "-hls_list_size 10",
      "-hls_flags delete_segments+independent_segments",
      "-hls_segment_type mpegts",
      "-hls_segment_filename",
      path.join(streamOutputPath, `segment_%03d.ts`),
    ])
    .output(path.join(streamOutputPath, "playlist.m3u8"));

  // Set up file watcher for segment processing
  const watcher = fs.watch(streamOutputPath, async (eventType, filename) => {
    if (eventType === "rename" && filename?.startsWith("segment_")) {
      const match = filename.match(/segment_(\d+)\.ts/);
      if (match) {
        const segmentNumber = parseInt(match[1]);
        const segmentPath = path.join(streamOutputPath, filename);
        const playlistPath = path.join(streamOutputPath, "playlist.m3u8");

        try {
          await processSegment(
            segmentPath,
            streamKey,
            segmentNumber,
            streamType,
            playlistPath
          );
        } catch (error) {
          console.error(`Error processing segment ${segmentNumber}:`, error);
        }
      }
    }
  });

  // Handle FFmpeg events
  ffmpegCommand
    .on("start", () => {
      console.log(`FFmpeg started for ${streamType} stream: ${streamKey}`);
    })
    .on("stderr", (stderrLine) => {
      if (stderrLine.includes("Error") || stderrLine.includes("error")) {
        console.error(`FFmpeg stderr (${streamType}):`, stderrLine);
      }
    })
    .on("error", async (error) => {
      console.error(
        `FFmpeg error for ${streamType} stream ${streamKey}:`,
        error
      );
      watcher.close();
    })
    .on("end", async () => {
      console.log(`FFmpeg ended for ${streamType} stream: ${streamKey}`);
      watcher.close();
    });

  // Start FFmpeg process
  ffmpegCommand.run();
  await waitForFFmpegReady(ffmpegCommand);

  return ffmpegCommand;
};

const waitForFFmpegReady = (command: ffmpeg.FfmpegCommand): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("FFmpeg initialization timeout"));
    }, 5000);

    command.on("start", () => {
      clearTimeout(timeout);
      setTimeout(resolve, 100);
    });

    command.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};
