import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SIGNAL_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050'; // Change to your backend URL

export function useBitchatWebRTC(myId: string) {
  const [peers, setPeers] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ from: string, content: string }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const dataChannels = useRef<{ [id: string]: RTCDataChannel }>({});

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  };

  // Connect to signaling server
  useEffect(() => {
    const socket = io(SIGNAL_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    addLog('Connecting to signaling server...');

    // Register yourself (optional: implement a register event)
    socket.emit('register', { id: myId });
    addLog(`Registered with signaling server as ${myId}`);

    // Listen for offers
    socket.on('bitchat-offer', async ({ offer, from }) => {
      addLog(`Received offer from ${from}`);
      const pc = createPeerConnection(from, socket);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('bitchat-answer', { to: from, answer });
      addLog(`Sent answer to ${from}`);
    });

    // Listen for answers
    socket.on('bitchat-answer', async ({ answer, from }) => {
      addLog(`Received answer from ${from}`);
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        addLog(`Set remote description for answer from ${from}`);
      }
    });

    // Listen for ICE candidates
    socket.on('bitchat-ice-candidate', async ({ candidate, from }) => {
      addLog(`Received ICE candidate from ${from}`);
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        addLog(`Added ICE candidate from ${from}`);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      addLog('Cleaned up connections and disconnected from signaling server.');
    };
  }, [myId]);

  // Create a new peer connection and data channel
  const createPeerConnection = useCallback((peerId: string, socket: Socket) => {
    addLog(`Creating RTCPeerConnection for ${peerId}`);
    const pc = new RTCPeerConnection();
    peerConnections.current[peerId] = pc;

    // Data channel (for initiator)
    let dc: RTCDataChannel | null = null;
    if (!dataChannels.current[peerId]) {
      dc = pc.createDataChannel('bitchat');
      addLog(`Created DataChannel to ${peerId}`);
      setupDataChannel(dc, peerId);
      dataChannels.current[peerId] = dc;
    }

    // For receiver: listen for data channel
    pc.ondatachannel = (event) => {
      addLog(`Received DataChannel from ${peerId}`);
      setupDataChannel(event.channel, peerId);
      dataChannels.current[peerId] = event.channel;
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog(`Sending ICE candidate to ${peerId}`);
        socket.emit('bitchat-ice-candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      addLog(`Connection state with ${peerId}: ${pc.connectionState}`);
    };

    return pc;
  }, []);

  // Setup data channel events
  const setupDataChannel = (dc: RTCDataChannel, peerId: string) => {
    dc.onopen = () => {
      addLog(`DataChannel open with ${peerId}`);
      setPeers(prev => [...new Set([...prev, peerId])]);
    };
    dc.onmessage = (event) => {
      addLog(`Received message from ${peerId}: ${event.data}`);
      setMessages(prev => [...prev, { from: peerId, content: event.data }]);
    };
    dc.onclose = () => {
      addLog(`DataChannel closed with ${peerId}`);
      setPeers(prev => prev.filter(id => id !== peerId));
    };
    dc.onerror = (e) => {
      addLog(`DataChannel error with ${peerId}: ${e}`);
    };
  };

  // Initiate connection to a peer
  const connectToPeer = async (peerId: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    addLog(`Initiating connection to ${peerId}`);
    const pc = createPeerConnection(peerId, socket);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('bitchat-offer', { to: peerId, offer });
    addLog(`Sent offer to ${peerId}`);
  };

  // Send a message to a peer
  const sendMessage = (peerId: string, content: string) => {
    const dc = dataChannels.current[peerId];
    addLog(`Trying to send to ${peerId}, state: ${dc?.readyState}`);
    if (dc && dc.readyState === 'open') {
      dc.send(content);
      addLog(`Sent message to ${peerId}: ${content}`);
      setMessages(prev => [...prev, { from: myId, content }]);
    } else {
      addLog(`Cannot send message, DataChannel not open with ${peerId}`);
    }
  };

  return { peers, messages, connectToPeer, sendMessage, logs };
}
