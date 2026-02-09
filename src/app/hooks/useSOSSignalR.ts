import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.MODE === 'production'
  ? '/hubs/sos'
  : 'http://localhost:5191/hubs/sos';

export interface SOSUpdatePayload {
  id: string;
  victimName: string;
  victimPhone: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  urgency: string;
  status: string;
  assignedResponder?: string;
  createdAt: string;
  updatedAt: string;
  solvedAt?: string;
}

export function useSOSSignalR(
  onSOSReceived?: (payload: SOSUpdatePayload) => void,
  onSOSUpdated?: (payload: SOSUpdatePayload) => void,
  enabled = true
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef({ onSOSReceived, onSOSUpdated });
  handlersRef.current = { onSOSReceived, onSOSUpdated };

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on('SOSReceived', (payload: SOSUpdatePayload) => {
      handlersRef.current.onSOSReceived?.(payload);
    });
    connection.on('SOSUpdated', (payload: SOSUpdatePayload) => {
      handlersRef.current.onSOSUpdated?.(payload);
    });

    connection.start()
      .then(() => console.log('[SOS] SignalR connected'))
      .catch(err => console.error('[SOS] SignalR connection error:', err));

    connectionRef.current = connection;
    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [enabled]);

  return { connection: connectionRef.current };
}
