import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.MODE === 'production'
  ? '/hubs/resources'
  : 'http://localhost:5191/hubs/resources';

export interface ResourceRequestCriticalPayload {
  id: string;
  warehouseId: string;
  resourceItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  destination: string;
  requestedBy: string;
  urgency: string;
  requestedAt: string;
}

export function useResourceSignalR(
  onCritical?: (payload: ResourceRequestCriticalPayload) => void,
  enabled = true
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlerRef = useRef(onCritical);
  handlerRef.current = onCritical;

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on('ResourceRequestCritical', (payload: ResourceRequestCriticalPayload) => {
      handlerRef.current?.(payload);
    });

    connection.start().catch(err => console.error('[Resource] SignalR connection error:', err));
    connectionRef.current = connection;

    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [enabled]);

  return { connection: connectionRef.current };
}

