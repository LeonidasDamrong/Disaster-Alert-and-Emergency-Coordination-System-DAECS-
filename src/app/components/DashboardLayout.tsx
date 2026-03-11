import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  ShieldAlert,
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Home as HomeIcon,
  Package,
  Users,
  LogOut,
  Bell
} from 'lucide-react';
import { Badge } from './ui/badge';
import { systemSettingsApi } from '../lib/api';
import { SystemSettings } from '../lib/types';
import { mockSystemSettings } from '../lib/mockData';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useNotifications } from '../context/NotificationContext';
import { useSOSSignalR } from '../hooks/useSOSSignalR';
import { useResourceSignalR } from '../hooks/useResourceSignalR';
import { useNotificationSignalR } from '../hooks/useNotificationSignalR';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<SystemSettings>(mockSystemSettings);
   const { notifications, unreadCount, addNotification, markAllRead, markAsRead } = useNotifications();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await systemSettingsApi.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch system settings:', error);
      }
    };

    fetchSettings();
  }, [location.pathname]); // Re-fetch on navigation to ensure updates are reflected

  useSOSSignalR(
    (payload) => {
      if (!user) return;

      if (user.role === 'Admin' || user.role === 'System Admin') {
        addNotification({
          title: 'New SOS received',
          message: `${payload.victimName} • ${payload.urgency} • ${payload.location}`,
          type: 'sos',
          link: '/sos',
          role: user.role,
        });
      } else if (user.role === 'First Responder') {
        addNotification({
          title: 'New SOS request',
          message: `${payload.victimName} • ${payload.urgency}`,
          type: 'sos',
          link: '/sos',
          role: user.role,
        });
      }
    },
    (payload) => {
      if (!user) return;
      if (user.role === 'First Responder' && payload.assignedResponder === user.name) {
        addNotification({
          title: 'SOS updated',
          message: `${payload.victimName} is now ${payload.status}`,
          type: 'sos',
          link: '/sos',
          role: user.role,
        });
      }
    },
    !!user
  );

  useResourceSignalR(
    (payload) => {
      if (!user) return;
      if (user.role === 'Resource Manager' || user.role === 'Admin' || user.role === 'System Admin') {
        const urgency = (payload.urgency || 'Medium').toString();
        addNotification({
          title: `${urgency} resource request`,
          message: `${payload.itemName} (${payload.quantity} ${payload.unit}) • ${payload.destination || 'No destination'}`,
          type: 'resource',
          link: '/resources',
          role: user.role,
        });
      }
    },
    !!user
  );

  useNotificationSignalR(
    (payload) => {
      if (!user) return;
      const isCreator = (user.name && payload.createdBy && user.name === payload.createdBy) || (user.userId && payload.createdBy === user.userId);
      if (isCreator) {
        addNotification({
          title: 'Announcement created',
          message: 'Your announcement was published.',
          type: 'announcement',
          link: '/admin',
        });
      } else {
        addNotification({
          title: payload.title,
          message: payload.content || payload.title,
          type: 'announcement',
          link: '/admin',
        });
      }
    },
    (payload) => {
      if (!user) return;
      const isCreator = (user.name && payload.createdBy && user.name === payload.createdBy) || (user.userId && payload.createdBy === user.userId);
      if (isCreator) {
        addNotification({
          title: 'Alert broadcast',
          message: 'Your alert was sent successfully.',
          type: 'alert',
          link: '/alerts',
        });
      } else {
        addNotification({
          title: payload.title,
          message: payload.message || payload.title,
          type: 'alert',
          link: '/alerts',
        });
      }
    },
    !!user
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['System Admin', 'Admin', 'First Responder', 'Shelter Manager', 'Resource Manager'] },
    { path: '/sos', icon: Radio, label: 'SOS Monitoring', roles: ['System Admin', 'Admin', 'First Responder'] },
    { path: '/alerts', icon: AlertTriangle, label: 'Alert Broadcasting', roles: ['System Admin', 'Admin', 'First Responder', 'Shelter Manager', 'Resource Manager', 'Disaster Manager'] },
    { path: '/shelters', icon: HomeIcon, label: 'Shelter Management', roles: ['System Admin', 'Admin', 'Shelter Manager'] },
    { path: '/resources', icon: Package, label: 'Resource Management', roles: ['System Admin', 'Admin', 'Resource Manager', 'Shelter Manager', 'First Responder', 'Disaster Manager'] },
    { path: '/admin', icon: Users, label: 'Admin Management', roles: ['System Admin', 'Admin'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.systemName}</h1>
                <p className="text-xs text-gray-500">{settings.organizationName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-h-4 min-w-4 px-1 bg-red-600 rounded-full text-[10px] text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="text-sm font-semibold">Notifications</span>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllRead();
                        }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        No notifications yet.
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                              !n.read ? 'bg-red-50/60' : ''
                            }`}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) {
                                navigate(n.link);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                              </div>
                              <span className="mt-0.5 text-[10px] text-gray-400">
                                {new Date(n.createdAt).toLocaleTimeString('en-MY', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-3 border-l pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <Badge variant="outline" className="text-xs">{user?.role}</Badge>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-[73px] h-[calc(100vh-73px)] overflow-y-auto z-40">
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 ${isActive(item.path)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
};