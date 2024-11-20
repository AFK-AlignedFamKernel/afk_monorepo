import { EventEmitter } from "events";

export const streamEvents = new EventEmitter();

// Increase max listeners if needed
streamEvents.setMaxListeners(20);

export const STREAM_EVENTS = {
  PLAYBACK_URL: "playback-url",
  STREAMING_URL: "streaming-url",
  STREAM_END: "stream-end",
  VIEWER_COUNT: "viewer-count",
  STREAM_ERROR: "stream-error",
} as const;
