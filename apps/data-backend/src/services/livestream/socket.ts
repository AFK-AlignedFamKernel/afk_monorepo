import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './streamEvent';
import {
  handleStartStream,
  // handleJoinStream,
  handleStreamData,
  handleEndStream,
  handleDisconnect,
  handleJoinStream,
  // handleDisconnect,
} from './streamHandler';

export const GENERAL_CHANNEL = "general";

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Auto-join every user to the general channel
    socket.join(GENERAL_CHANNEL);
    socket.emit('channel-join', { channel: GENERAL_CHANNEL, nickname: 'system' });

    console.log('Client connected:', socket.id);

    // Stream event listeners
    streamEvents.on(STREAM_EVENTS.PLAYBACK_URL, (data) => {
      socket.emit('playback-url', data);
    });
    streamEvents.on(STREAM_EVENTS.STREAMING_URL, (data) => {
      socket.emit('streaming-url', data);
    });

    streamEvents.on(STREAM_EVENTS.STREAM_END, ({ streamKey }) => {
      socket.to(streamKey).emit('stream-ended', { streamKey });
    });

    streamEvents.on(STREAM_EVENTS.VIEWER_COUNT, ({ streamKey, count }) => {
      socket.to(streamKey).emit('viewer-count', count);
    });

    streamEvents.on(STREAM_EVENTS.STREAM_ERROR, (error) => {
      socket.emit('stream-error', error);
    });

    // New stream status events
    streamEvents.on(STREAM_EVENTS.STREAM_INITIALIZED, (data) => {
      socket.to(data.streamKey).emit('stream-initialized', data);
    });

    streamEvents.on(STREAM_EVENTS.STREAM_STARTED, (data) => {
      socket.to(data.streamKey).emit('stream-started', data);
    });

    streamEvents.on(STREAM_EVENTS.STREAM_READY, (data) => {
      socket.to(data.streamKey).emit('stream-ready', data);
    });

    //Handle Screen and camera stream
    socket.on('start-stream', (data) => handleStartStream(socket, data));

    //Handle Screen and camera stream
    socket.on('stream-data', (data) => handleStreamData(socket, data));

    socket.on('join-stream', (data) => handleJoinStream(socket, data));
    socket.on('end-stream', (data) => handleEndStream(socket, data));

    // WebRTC signaling
    socket.on('stream-offer', (data) => {
      socket.to(data.streamKey).emit('stream-offer', {
        offer: data.offer,
        streamerId: socket.id,
      });
    });

    socket.on('stream-answer', (data) => {
      socket.to(data.streamerId).emit('stream-answer', {
        answer: data.answer,
        viewerId: socket.id,
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.recipientId).emit('ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id,
      });
    });

    // === Bitchat WebRTC Signaling Events ===
    // These events are for bitchat peer-to-peer messaging, separate from livestreaming

    // When a client wants to initiate a WebRTC connection with another peer
    socket.on('bitchat-offer', (data) => {
      // data: { to: recipientSocketId, offer: RTCSessionDescription }
      socket.to(data.to).emit('bitchat-offer', {
        offer: data.offer,
        from: socket.id,
      });
    });

    // When a client responds to a WebRTC offer
    socket.on('bitchat-answer', (data) => {
      // data: { to: recipientSocketId, answer: RTCSessionDescription }
      socket.to(data.to).emit('bitchat-answer', {
        answer: data.answer,
        from: socket.id,
      });
    });

    // When a client sends an ICE candidate
    socket.on('bitchat-ice-candidate', (data) => {
      // data: { to: recipientSocketId, candidate: RTCIceCandidate }
      socket.to(data.to).emit('bitchat-ice-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    // User joins a channel (room)
    socket.on('join-channel', ({ channel, nickname }) => {
      socket.join(channel);
      // Optionally notify others
      socket.to(channel).emit('channel-join', { channel, nickname });
    });

    // User leaves a channel
    socket.on('leave-channel', ({ channel, nickname }) => {
      socket.leave(channel);
      socket.to(channel).emit('channel-leave', { channel, nickname });
    });

    // User sends a message to a channel
    socket.on('channel-message', ({ channel, content, sender }) => {
      console.log('Received message from channel:', content);
      console.log('Channel:', channel);
      console.log('Sender:', sender);
      io.to(channel).emit('channel-message', { channel, content, sender });
    });

    // socket.on("disconnect", (userId) => handleDisconnect(socket));
  });
};
