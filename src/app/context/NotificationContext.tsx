import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type NotificationKind = 'sos' | 'resource' | 'alert' | 'announcement' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationKind;
  createdAt: string;
  read: boolean;
  link?: string;
  role?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'> & { createdAt?: string }) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification: NotificationContextValue['addNotification'] = useCallback((input) => {
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const createdAt = input.createdAt ?? new Date().toISOString();

    setNotifications((prev) => [
      {
        id,
        read: false,
        createdAt,
        ...input,
      },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      markAsRead,
    }),
    [notifications, unreadCount, addNotification, markAllRead, markAsRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};

