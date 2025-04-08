import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';


export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Stream event listeners
    // streamEvents.on(STREAM_EVENTS.PLAYBACK_URL, (data) => {
    //   socket.emit('playback-url', data);
    // });
    // streamEvents.on(STREAM_EVENTS.STREAMING_URL, (data) => {
    //   socket.emit('streaming-url', data);
    // });

    // streamEvents.on(STREAM_EVENTS.STREAM_END, ({ streamKey }) => {
    //   socket.to(streamKey).emit('stream-ended', { streamKey });
    // });

    // streamEvents.on(STREAM_EVENTS.VIEWER_COUNT, ({ streamKey, count }) => {
    //   socket.to(streamKey).emit('viewer-count', count);
    // });

    // streamEvents.on(STREAM_EVENTS.STREAM_ERROR, (error) => {
    //   socket.emit('stream-error', error);
    // });

    // //Handle Screen and camera stream
    // socket.on('start-stream', (data) => handleStartStream(socket, data));

    // //Handle Screen and camera stream
    // socket.on('stream-data', (data) => handleStreamData(socket, data));

    // socket.on('join-stream', (data) => handleJoinStream(socket, data));
    // socket.on('end-stream', (data) => handleEndStream(socket, data));

    // // WebRTC signaling
    // socket.on('stream-offer', (data) => {
    //   socket.to(data.streamKey).emit('stream-offer', {
    //     offer: data.offer,
    //     streamerId: socket.id,
    //   });
    // });

    // socket.on('stream-answer', (data) => {
    //   socket.to(data.streamerId).emit('stream-answer', {
    //     answer: data.answer,
    //     viewerId: socket.id,
    //   });
    // });

    // socket.on('ice-candidate', (data) => {
    //   socket.to(data.recipientId).emit('ice-candidate', {
    //     candidate: data.candidate,
    //     senderId: socket.id,
    //   });
    // });

    // socket.on("disconnect", (userId) => handleDisconnect(socket));
  });
};
