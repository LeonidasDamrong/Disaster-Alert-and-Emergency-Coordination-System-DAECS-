import React, { useState, useEffect, useMemo } from 'react';
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
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { systemSettingsApi, authApi } from '../lib/api';
import { getNewPasswordValidationErrors, PASSWORD_REQUIREMENTS_SUMMARY } from '../lib/passwordPolicy';
import { SystemSettings } from '../lib/types';
import { mockSystemSettings } from '../lib/mockData';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useNotifications } from '../context/NotificationContext';
import { useSOSSignalR } from '../hooks/useSOSSignalR';
import { useResourceSignalR } from '../hooks/useResourceSignalR';
import { useNotificationSignalR } from '../hooks/useNotificationSignalR';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ConfirmDialog } from './ConfirmDialog';

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

  const confirmLogout = () => {
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const mainMarginClass = sidebarCollapsed ? 'md:ml-16' : 'md:ml-64';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const systemShortName = useMemo(() => {
    if (!settings?.systemName) return '';
    const short = settings.systemName.split(' - ')[0];
    return short || settings.systemName;
  }, [settings.systemName]);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const newPasswordPolicyErrors = useMemo(
    () => (newPassword.length > 0 ? getNewPasswordValidationErrors(newPassword) : []),
    [newPassword]
  );

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Re-enter the new password in both fields.');
      return;
    }
    const policyErrors = getNewPasswordValidationErrors(newPassword);
    if (policyErrors.length > 0) {
      const lines =
        policyErrors.length === 1
          ? policyErrors[0]
          : ['The new password does not meet the requirements:', ...policyErrors.map((line) => `• ${line}`)].join('\n');
      setPasswordError(lines);
      return;
    }
    setPasswordSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setChangePasswordOpen(false);
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - compact on small windows */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              {/* Mobile menu trigger - only on small screens */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 flex flex-col [&>button]:hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-600 p-2 rounded">
                        <ShieldAlert className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold text-sm truncate">Menu</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeMobileMenu} aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={closeMobileMenu}>
                        <Button
                          variant={isActive(item.path) ? 'default' : 'ghost'}
                          className={`w-full justify-start gap-3 ${isActive(item.path)
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'hover:bg-gray-100'
                            }`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="bg-red-600 p-1.5 md:p-2 rounded shrink-0">
                <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
                  <span className="md:hidden">{systemShortName}</span>
                  <span className="hidden md:inline">{settings.systemName}</span>
                </h1>
                <p className="text-[11px] md:text-xs text-gray-500 truncate hidden sm:block">{settings.organizationName}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
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
                  <div className="max-h-80 overflow-y-auto scrollbar-dialog">
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

              <div className="flex items-center gap-2 md:gap-3 border-l border-gray-200 pl-2 md:pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold truncate max-w-[120px]">{user?.name}</p>
                  <Badge variant="outline" className="text-xs">{user?.role}</Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 h-8 md:h-9"
                  onClick={() => {
                    resetPasswordForm();
                    setChangePasswordOpen(true);
                  }}
                  title="Change password"
                >
                  <KeyRound className="h-4 w-4" />
                  <span className="hidden lg:inline">Change Password</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 h-8 md:h-9"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Collapsible Sidebar - desktop only; on small windows use Sheet menu */}
        <aside
          className={`hidden md:flex ${sidebarWidth} bg-white border-r border-gray-200 fixed left-0 top-[65px] h-[calc(100vh-65px)] flex-col transition-[width] duration-200 ease-in-out z-40`}
        >
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
            {filteredNavItems.map((item) => (
              <Link key={item.path} to={item.path} title={sidebarCollapsed ? item.label : undefined}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 ${isActive(item.path)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={`inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${sidebarCollapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[10rem] opacity-100'}`}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content - full width on mobile, sidebar margin on desktop */}
        <main className={`flex-1 min-w-0 p-4 sm:p-5 md:p-6 ml-0 ${mainMarginClass} flex flex-col min-h-0 transition-[margin] duration-200 ease-in-out`}>
          {children}
        </main>
      </div>

      <Dialog
        open={changePasswordOpen}
        onOpenChange={(open) => {
          setChangePasswordOpen(open);
          if (!open) resetPasswordForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleChangePasswordSubmit}>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription className="space-y-2">
                <span className="block">
                  Enter your current password, then choose a new password. This applies to your account only.
                </span>
                <span className="block text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS_SUMMARY}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-invalid={newPassword.length > 0 && newPasswordPolicyErrors.length > 0}
                />
                {newPasswordPolicyErrors.length > 0 ? (
                  <ul className="text-xs text-amber-700 list-disc pl-5 space-y-0.5" role="status">
                    {newPasswordPolicyErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError ? (
                <p className="text-sm text-red-600 whitespace-pre-line" role="alert">
                  {passwordError}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                disabled={passwordSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={passwordSubmitting}>
                {passwordSubmitting ? 'Updating…' : 'Update password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="You will need to sign in again to use the system."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="primary"
        onConfirm={confirmLogout}
      />
    </div>
  );
};