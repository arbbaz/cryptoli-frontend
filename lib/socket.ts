// Client-side Socket.IO – connects to backend (e.g. Railway). Set NEXT_PUBLIC_SOCKET_URL to backend URL.
'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socketInstance: Socket | null = null;
const isDev = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDev) console.log(...args);
}

function debugError(...args: unknown[]) {
  if (isDev) console.error(...args);
}

function debugWarn(...args: unknown[]) {
  if (isDev) console.warn(...args);
}

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socketInstance) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      window.location.origin;
    debugLog('🔌 Initializing socket connection to:', socketUrl);
    if (isDev && !process.env.NEXT_PUBLIC_SOCKET_URL && socketUrl === window.location.origin) {
      debugWarn('💡 Socket will connect to same origin. If your API runs elsewhere, set NEXT_PUBLIC_SOCKET_URL in .env.local');
    }
    socketInstance = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      forceNew: false,
      autoConnect: true,
    });

    // Set up global connection handlers
    socketInstance.on('connect', () => {
      debugLog('✅ Socket connected, ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      debugLog('❌ Socket disconnected, reason:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      // Log as warning so app doesn't look broken; socket is optional (notifications, real-time counts)
      debugWarn('⚠️ Socket connection failed:', error.message || error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      debugLog('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      debugLog('🔄 Reconnection attempt', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      debugWarn('⚠️ Reconnection failed:', error.message || error);
    });

    socketInstance.on('reconnect_failed', () => {
      debugError('❌ Reconnection failed');
    });
  }

  return socketInstance;
}

export function useSocket() {
  const [socket] = useState<Socket | null>(() =>
    typeof window === 'undefined' ? null : getSocket(),
  );
  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Update connection state
    const handleConnect = () => {
      debugLog('✅ useSocket: Socket connected, ID:', socket?.id);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      debugLog('❌ useSocket: Socket disconnected, reason:', reason);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return { socket, isConnected };
}

export function refreshSocketConnection(): void {
  if (!socketInstance) {
    return;
  }

  if (socketInstance.connected) {
    socketInstance.disconnect();
  }
  socketInstance.connect();
}
