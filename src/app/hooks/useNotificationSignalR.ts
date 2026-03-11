import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.MODE === 'production'
  ? '/hubs/notifications'
  : 'http://localhost:5191/hubs/notifications';

export interface AnnouncementCreatedPayload {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdBy: string;
  createdAt: string;
}

export interface AlertBroadcastPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  createdBy: string;
  sentAt: string | null;
}

export function useNotificationSignalR(
  onAnnouncementCreated?: (payload: AnnouncementCreatedPayload) => void,
  onAlertBroadcast?: (payload: AlertBroadcastPayload) => void,
  enabled = true
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef({ onAnnouncementCreated, onAlertBroadcast });
  handlersRef.current = { onAnnouncementCreated, onAlertBroadcast };

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on('AnnouncementCreated', (payload: AnnouncementCreatedPayload) => {
      handlersRef.current.onAnnouncementCreated?.(payload);
    });
    connection.on('AlertBroadcast', (payload: AlertBroadcastPayload) => {
      handlersRef.current.onAlertBroadcast?.(payload);
    });

    connection.start()
      .then(() => console.log('[Notification] SignalR connected'))
      .catch(err => console.error('[Notification] SignalR connection error:', err));

    connectionRef.current = connection;
    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [enabled]);

  return { connection: connectionRef.current };
}
