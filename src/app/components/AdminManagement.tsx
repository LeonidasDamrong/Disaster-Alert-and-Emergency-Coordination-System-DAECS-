import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Plus, Clock, Settings, Bell, Pencil, Trash2, Save, X } from 'lucide-react';
import { mockSystemSettings } from '../lib/mockData';
import { User, UserRole, AuditLog, Announcement, SystemSettings } from '../lib/types';
import { toast } from 'sonner';
import { authApi, auditLogApi, systemSettingsApi, announcementApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from './ui/use-mobile';
import { sortByIdDesc } from '../lib/sort';
import { ConfirmDialog } from './ConfirmDialog';
import {
  hasAdminUserFieldErrors,
  validateCreateUserInput,
  validateEditUserInput,
} from '../lib/adminUserValidation';
import { PASSWORD_HINT_SHORT } from '../lib/passwordPolicy';

const getShortName = (s: string) => (s && s.split(' - ')[0]) || s || '';

/** Keeps Malaysia +60 prefix and digits-only after prefix (same as create form). */
function normalizeMalaysiaPhoneInput(prevPhone: string, raw: string): string {
  if (raw === '+6') return '+60';
  if (!raw.startsWith('+60')) return prevPhone;
  const numPart = raw.slice(3);
  if (/^\d*$/.test(numPart)) return raw;
  return prevPhone;
}

/** Snapshot of editable fields when “Edit” was opened — used to detect real changes. */
type EditableUserFields = { name: string; email: string; phone: string };

function normalizeUserFieldsForCompare(f: EditableUserFields): EditableUserFields {
  return {
    name: f.name.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim(),
  };
}

function editableUserFieldsEqual(a: EditableUserFields, b: EditableUserFields): boolean {
  const x = normalizeUserFieldsForCompare(a);
  const y = normalizeUserFieldsForCompare(b);
  return x.name === y.name && x.email === y.email && x.phone === y.phone;
}

export const AdminManagement = () => {
  const { user: currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(mockSystemSettings);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<SystemSettings>(mockSystemSettings);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  /** Values when the edit dialog was opened (before any edits). */
  const [editUserBaseline, setEditUserBaseline] = useState<EditableUserFields | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: '',
    password: '',
    name: '',
    role: 'First Responder' as UserRole,
    email: '',
    phone: '+60'
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'Low' as 'Low' | 'Medium' | 'High',
    expiresAt: ''
  });

  const [deleteUserDialog, setDeleteUserDialog] = useState<User | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [createUserConfirmOpen, setCreateUserConfirmOpen] = useState(false);
  const [updateUserConfirmOpen, setUpdateUserConfirmOpen] = useState(false);
  const [saveSettingsConfirmOpen, setSaveSettingsConfirmOpen] = useState(false);
  const [createAnnouncementFormOpen, setCreateAnnouncementFormOpen] = useState(false);
  const [announcementPublishConfirmOpen, setAnnouncementPublishConfirmOpen] = useState(false);
  const [announcementPendingDelete, setAnnouncementPendingDelete] = useState<Announcement | null>(null);

  // Fetch users, roles, audit logs, and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingUsers(true);
        const [usersData, rolesData, settingsData] = await Promise.all([
          authApi.getAllUsers(),
          authApi.getRoles(),
          systemSettingsApi.getSettings()
        ]);
        setUsers(usersData);
        setSystemSettings(settingsData);
        setTempSettings(settingsData);

        const roleList = rolesData.length > 0 ? rolesData : ['First Responder', 'Shelter Manager', 'Resource Manager'];
        setRoles(roleList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load system data');
        setRoles(['First Responder', 'Shelter Manager', 'Resource Manager']);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchData();
  }, []);

  // Fetch audit logs when Audit Logs tab is relevant
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoadingAuditLogs(true);
        const data = await auditLogApi.getAuditLogs();
        setAuditLogs(data);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
      } finally {
        setIsLoadingAuditLogs(false);
      }
    };

    fetchAuditLogs();
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementApi.getAll();
        setAnnouncements(data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []);

  // Set default role when roles load and current role may not exist
  useEffect(() => {
    if (roles.length > 0 && !roles.includes(newUser.role)) {
      setNewUser((prev) => ({ ...prev, role: roles[0] as UserRole }));
    }
  }, [roles]);

  // Auto-generate User ID and Email when role changes during user creation
  useEffect(() => {
    if (isDialogOpen && newUser.role) {
      authApi.getNextUserId(newUser.role)
        .then((res) => setNewUser((prev) => ({
          ...prev,
          userId: res.nextUserId,
          email: `${res.nextUserId.toLowerCase()}@daecs.gov.my`
        })))
        .catch(() => { });
    }
  }, [isDialogOpen, newUser.role]);

  const hasEditingUserChanges = useMemo(() => {
    if (!editingUser || !editUserBaseline) return false;
    return !editableUserFieldsEqual(
      { name: editingUser.name, email: editingUser.email, phone: editingUser.phone },
      editUserBaseline
    );
  }, [editingUser, editUserBaseline]);

  const createUserFieldErrors = useMemo(
    () =>
      validateCreateUserInput({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
      }),
    [newUser.name, newUser.email, newUser.phone, newUser.password],
  );

  const editUserFieldErrors = useMemo(() => {
    if (!editingUser) return {};
    return validateEditUserInput({
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
    });
  }, [editingUser]);

  const createUserFormValid = Boolean(
    newUser.userId && !hasAdminUserFieldErrors(createUserFieldErrors),
  );

  const editUserFormValid = !hasAdminUserFieldErrors(editUserFieldErrors);

  const performCreateUser = async () => {
    const v = validateCreateUserInput({
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      password: newUser.password,
    });
    if (hasAdminUserFieldErrors(v)) {
      toast.error(v.name ?? v.email ?? v.phone ?? v.password ?? 'Please fix the highlighted fields.');
      throw new Error('Validation failed');
    }

    setIsCreatingUser(true);

    try {
      await authApi.register({
        userId: newUser.userId,
        password: newUser.password,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      });

      const updatedUsers = await authApi.getAllUsers();
      setUsers(updatedUsers);

      setNewUser({
        userId: '',
        password: '',
        name: '',
        role: 'First Responder',
        email: '',
        phone: '+60'
      });

      setIsDialogOpen(false);
      setCreateUserConfirmOpen(false);
      toast.success('User created successfully and saved to database');

      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);
    } catch (error) {
      let errorMessage = 'Failed to create user';

      if (error instanceof Error) {
        errorMessage = error.message;

        if (errorMessage.includes('password') || errorMessage.includes('Password')) {
          errorMessage +=
            '\n\nPassword must have:\n• At least 6 characters\n• Uppercase letter (A-Z)\n• Lowercase letter (a-z)\n• Number (0-9)\n• Special character (e.g. ! @ # $)';
        }
      }

      toast.error(errorMessage);
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setIsCreatingUser(false);
    }
  };

  const performUpdateUser = async () => {
    if (!editingUser) {
      throw new Error('No user to update');
    }
    if (!editUserBaseline) {
      toast.error('Edit session expired. Close and open edit again.');
      throw new Error('No baseline');
    }
    if (
      editableUserFieldsEqual(
        { name: editingUser.name, email: editingUser.email, phone: editingUser.phone },
        editUserBaseline
      )
    ) {
      toast.info('No changes to save. Name, email, and phone are unchanged.');
      throw new Error('No changes');
    }

    const fieldErr = validateEditUserInput({
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
    });
    if (hasAdminUserFieldErrors(fieldErr)) {
      toast.error(fieldErr.name ?? fieldErr.email ?? fieldErr.phone ?? 'Please fix the highlighted fields.');
      throw new Error('Validation failed');
    }

    setIsEditingUser(true);
    try {
      await authApi.updateUser(editingUser.userId, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone
      });
      const updatedUsers = await authApi.getAllUsers();
      setUsers(updatedUsers);
      setEditingUser(null);
      setEditUserBaseline(null);
      setUpdateUserConfirmOpen(false);

      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);

      toast.success('User updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsEditingUser(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeleteUserDialog(user);
    setDeleteConfirmation('');
  };

  const performDeleteUser = async () => {
    if (!deleteUserDialog) {
      throw new Error('No user selected');
    }
    if (deleteConfirmation !== deleteUserDialog.userId) {
      toast.error('Type the User ID exactly as shown to confirm deletion.');
      throw new Error('Confirmation mismatch');
    }

    try {
      await authApi.deleteUser(deleteUserDialog.userId);
      const updatedUsers = await authApi.getAllUsers();
      setUsers(updatedUsers);

      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);

      toast.success('User deleted successfully');
      setDeleteUserDialog(null);
      setDeleteConfirmation('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditSettings = () => {
    setTempSettings({ ...systemSettings });
    setIsEditingSettings(true);
  };

  const performSaveSettings = async () => {
    try {
      await systemSettingsApi.updateSettings(tempSettings);
      setSystemSettings(tempSettings);
      setIsEditingSettings(false);
      setSaveSettingsConfirmOpen(false);

      toast.success('System settings updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      throw error;
    }
  };

  const performPublishAnnouncement = async () => {
    try {
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        isActive: true,
        expiresAt: newAnnouncement.expiresAt ? new Date(newAnnouncement.expiresAt).toISOString() : undefined,
      };

      await announcementApi.create(announcementData as Partial<Announcement>);
      toast.success('Announcement published');
      const data = await announcementApi.getAll();
      setAnnouncements(data);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'Low',
        expiresAt: '',
      });
      setAnnouncementPublishConfirmOpen(false);
      setCreateAnnouncementFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create announcement');
      throw error;
    }
  };

  const performDeleteAnnouncement = async () => {
    if (!announcementPendingDelete) {
      throw new Error('No announcement selected');
    }
    try {
      await announcementApi.delete(announcementPendingDelete.id);
      toast.success('Announcement deleted');
      const data = await announcementApi.getAll();
      setAnnouncements(data);
      setAnnouncementPendingDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
      throw err;
    }
  };

  const handleCancelSettings = () => {
    setIsEditingSettings(false);
    setTempSettings(systemSettings);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'System Admin': return 'bg-gray-900 text-white';
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'First Responder': return 'bg-blue-100 text-blue-800';
      case 'Shelter Manager': return 'bg-green-100 text-green-800';
      case 'Resource Manager': return 'bg-purple-100 text-purple-800';
      case 'Disaster Manager': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const systemNameDisplay = isMobile && !isEditingSettings
    ? getShortName(systemSettings.systemName)
    : (isEditingSettings ? tempSettings.systemName : systemSettings.systemName);

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-3xl font-bold truncate">{isMobile ? 'Admin' : 'Admin Management'}</h2>
          <p className="text-sm sm:text-base text-gray-600 truncate">{isMobile ? 'Admin & config' : 'System administration and configuration'}</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto flex-nowrap p-1 h-auto gap-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="users" className="gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isMobile ? 'Users' : 'User Management'}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isMobile ? 'Settings' : 'System Settings'}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isMobile ? 'Announce' : 'Announcements'}
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold mt-1">{users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'Admin').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Responders</p>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'First Responder').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'Shelter Manager' || u.role === 'Resource Manager').length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Accounts</CardTitle>
                  <CardDescription>Manage system user accounts and roles</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add account details. User ID and email are generated from the role you pick.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label>User ID *</Label>
                          <Input
                            value={newUser.userId}
                            placeholder="Auto-generated"
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-muted-foreground">From role</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Password *</Label>
                          <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            disabled={isCreatingUser}
                            aria-invalid={!!createUserFieldErrors.password}
                          />
                          {createUserFieldErrors.password ? (
                            <p className="text-xs text-red-600">{createUserFieldErrors.password}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{PASSWORD_HINT_SHORT}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="create-user-name">Full Name *</Label>
                        <Input
                          id="create-user-name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Enter full name"
                          disabled={isCreatingUser}
                          aria-invalid={!!createUserFieldErrors.name}
                        />
                        {createUserFieldErrors.name ? (
                          <p className="text-xs text-red-600">{createUserFieldErrors.name}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Role *</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as UserRole }))}
                          disabled={isCreatingUser}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="create-user-email">Email *</Label>
                          <Input
                            id="create-user-email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="email@daecs.gov.my"
                            disabled={isCreatingUser}
                            autoComplete="off"
                            aria-invalid={!!createUserFieldErrors.email}
                          />
                          {createUserFieldErrors.email ? (
                            <p className="text-xs text-red-600">{createUserFieldErrors.email}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="create-user-phone">Phone *</Label>
                          <Input
                            id="create-user-phone"
                            value={newUser.phone}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                phone: normalizeMalaysiaPhoneInput(prev.phone, e.target.value),
                              }))
                            }
                            placeholder="+60123456789"
                            disabled={isCreatingUser}
                            inputMode="tel"
                            aria-invalid={!!createUserFieldErrors.phone}
                          />
                          {createUserFieldErrors.phone ? (
                            <p className="text-xs text-red-600">{createUserFieldErrors.phone}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">+60 then 8–11 digits</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!createUserFormValid) {
                            toast.error('Please fix the highlighted fields before continuing.');
                            return;
                          }
                          setCreateUserConfirmOpen(true);
                        }}
                        className="w-full"
                        disabled={!createUserFormValid || isCreatingUser}
                      >
                        Create User Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-500">Loading users...</p>
                </div>
              ) : (
                <>
                  {/* Edit User Dialog */}
                  <Dialog
                    open={!!editingUser}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingUser(null);
                        setEditUserBaseline(null);
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user information</DialogDescription>
                      </DialogHeader>
                      {editingUser && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>User ID</Label>
                            <Input value={editingUser.userId} disabled className="bg-gray-50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-user-name">Full Name *</Label>
                            <Input
                              id="edit-user-name"
                              value={editingUser.name}
                              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                              placeholder="Enter full name"
                              disabled={isEditingUser}
                              aria-invalid={!!editUserFieldErrors.name}
                            />
                            {editUserFieldErrors.name ? (
                              <p className="text-xs text-red-600">{editUserFieldErrors.name}</p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-user-email">Email *</Label>
                            <Input
                              id="edit-user-email"
                              type="email"
                              value={editingUser.email}
                              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                              placeholder="email@daecs.gov.my"
                              disabled={isEditingUser}
                              aria-invalid={!!editUserFieldErrors.email}
                            />
                            {editUserFieldErrors.email ? (
                              <p className="text-xs text-red-600">{editUserFieldErrors.email}</p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-user-phone">Phone *</Label>
                            <Input
                              id="edit-user-phone"
                              value={editingUser.phone}
                              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                              placeholder="+60123456789"
                              disabled={isEditingUser}
                              inputMode="tel"
                              aria-invalid={!!editUserFieldErrors.phone}
                            />
                            {editUserFieldErrors.phone ? (
                              <p className="text-xs text-red-600">{editUserFieldErrors.phone}</p>
                            ) : (
                              <p className="text-xs text-gray-500">Malaysia format: +60 and 8–11 digits.</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!hasEditingUserChanges) {
                                toast.info('No changes to save. Edit name, email, or phone before updating.');
                                return;
                              }
                              if (!editUserFormValid) {
                                toast.error('Please fix the highlighted fields before updating.');
                                return;
                              }
                              setUpdateUserConfirmOpen(true);
                            }}
                            className="w-full"
                            disabled={
                              isEditingUser ||
                              !hasEditingUserChanges ||
                              !editUserFormValid
                            }
                          >
                            Update User
                          </Button>
                          {editUserBaseline &&
                          editingUser.name &&
                          editingUser.email &&
                          editingUser.phone &&
                          !hasEditingUserChanges ? (
                            <p className="text-xs text-muted-foreground text-center">
                              Change name, email, or phone to something different from the current values to update.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortByIdDesc(users, (u) => u.userId ?? u.id).map((user) => (
                          <TableRow key={user.id ?? user.userId}>
                            <TableCell className="font-mono">{user.userId}</TableCell>
                            <TableCell className="font-semibold">{user.name}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell className="text-sm">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-MY') : '-'}
                            </TableCell>
                            <TableCell>
                              {currentUser?.role === 'System Admin' || (currentUser?.role === 'Admin' && user.role !== 'System Admin' && user.role !== 'Admin') ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser({ ...user });
                                      setEditUserBaseline({
                                        name: user.name ?? '',
                                        email: user.email ?? '',
                                        phone: user.phone ?? '',
                                      });
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>System activity and user action logs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAuditLogs ? (
                <p className="text-sm text-gray-500">Loading audit logs...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User Info</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortByIdDesc(auditLogs, (l) => l.id).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString('en-MY')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div>{log.name}</div>
                          <div className="text-xs text-gray-500">{log.username}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="text-sm text-gray-600">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-xl">{isMobile ? 'Settings' : 'System Settings'}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{isMobile ? 'Configure parameters' : 'Configure system parameters'}</CardDescription>
                </div>
                {currentUser?.role === 'System Admin' && !isEditingSettings && (
                  <Button onClick={handleEditSettings} size="sm" variant="outline" className="gap-2 shrink-0">
                    <Pencil className="h-4 w-4" />
                    {isMobile ? 'Edit' : 'Edit Settings'}
                  </Button>
                )}
                {isEditingSettings && (
                  <div className="flex gap-2 shrink-0">
                    <Button onClick={handleCancelSettings} size="sm" variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setSaveSettingsConfirmOpen(true)}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                      {isMobile ? 'Save' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Input
                    value={systemNameDisplay}
                    readOnly={!isEditingSettings}
                    onChange={(e) => setTempSettings({ ...tempSettings, systemName: e.target.value })}
                    className={!isEditingSettings ? 'bg-gray-50' : ''}
                    title={systemSettings.systemName}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={isEditingSettings ? tempSettings.organizationName : systemSettings.organizationName}
                    readOnly={!isEditingSettings}
                    onChange={(e) => setTempSettings({ ...tempSettings, organizationName: e.target.value })}
                    className={!isEditingSettings ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Number</Label>
                  <Input
                    value={isEditingSettings ? tempSettings.emergencyContactNumber : systemSettings.emergencyContactNumber}
                    readOnly={!isEditingSettings}
                    onChange={(e) => setTempSettings({ ...tempSettings, emergencyContactNumber: e.target.value })}
                    className={!isEditingSettings ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notifications Enabled</Label>
                  <Select
                    value={isEditingSettings ? (tempSettings.enableNotifications ? 'Yes' : 'No') : (systemSettings.enableNotifications ? 'Yes' : 'No')}
                    onValueChange={(val) => setTempSettings({ ...tempSettings, enableNotifications: val === 'Yes' })}
                    disabled={!isEditingSettings}
                  >
                    <SelectTrigger className={!isEditingSettings ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Announcements</CardTitle>
                  <CardDescription>Manage system-wide announcements</CardDescription>
                </div>
                <Dialog open={createAnnouncementFormOpen} onOpenChange={setCreateAnnouncementFormOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>Broadcast a new message to all users</DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          required
                          placeholder="e.g. System Maintenance"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          name="priority"
                          value={newAnnouncement.priority}
                          onValueChange={(val: 'Low' | 'Medium' | 'High') => setNewAnnouncement({ ...newAnnouncement, priority: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Input
                          id="content"
                          name="content"
                          required
                          placeholder="Announcement details..."
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                        <Input
                          id="expiresAt"
                          name="expiresAt"
                          type="date"
                          value={newAnnouncement.expiresAt}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
                            toast.error('Title and content are required.');
                            return;
                          }
                          setAnnouncementPublishConfirmOpen(true);
                        }}
                      >
                        Publish Announcement
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className={
                            announcement.priority === 'High' ? 'bg-red-100 text-red-800' :
                              announcement.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                          }>
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created by: {announcement.createdBy}</span>
                          <span>Date: {new Date(announcement.createdAt).toLocaleDateString('en-MY')}</span>
                          {announcement.expiresAt && (
                            <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString('en-MY')}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setAnnouncementPendingDelete(announcement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-center text-gray-500 py-6">No announcements found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={createUserConfirmOpen}
        onOpenChange={setCreateUserConfirmOpen}
        title="Create this user account?"
        description={
          <span>
            A new account will be created for <strong>{newUser.name || '—'}</strong> ({' '}
            <span className="font-mono">{newUser.userId || '—'}</span>) with role{' '}
            <strong>{newUser.role}</strong>. This will be saved to the database.
          </span>
        }
        confirmLabel="Yes, create user"
        onConfirm={performCreateUser}
      />

      <ConfirmDialog
        open={updateUserConfirmOpen}
        onOpenChange={setUpdateUserConfirmOpen}
        title="Save changes to this user?"
        description={
          editingUser ? (
            <span>
              Updates will apply to <strong>{editingUser.name}</strong> ({' '}
              <span className="font-mono">{editingUser.userId}</span>) including name, email, and phone.
            </span>
          ) : (
            'Save the edited profile details.'
          )
        }
        confirmLabel="Save changes"
        onConfirm={performUpdateUser}
      />

      <ConfirmDialog
        open={!!deleteUserDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUserDialog(null);
            setDeleteConfirmation('');
          }
        }}
        variant="destructive"
        title="Delete this user permanently?"
        description="This cannot be undone. The account will be removed from the system."
        confirmLabel="Delete user"
        confirmDisabled={!deleteUserDialog || deleteConfirmation !== deleteUserDialog.userId}
        onConfirm={performDeleteUser}
      >
        {deleteUserDialog ? (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
              You are about to delete <strong>{deleteUserDialog.name}</strong> ({' '}
              <span className="font-mono">{deleteUserDialog.userId}</span>).
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-user-confirm-input">
                To confirm, type <span className="font-mono font-bold select-all">{deleteUserDialog.userId}</span>{' '}
                below:
              </Label>
              <Input
                id="delete-user-confirm-input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={deleteUserDialog.userId}
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={saveSettingsConfirmOpen}
        onOpenChange={setSaveSettingsConfirmOpen}
        title="Save system settings?"
        description="These values are used across the application (system name, contacts, notifications). Continue?"
        confirmLabel="Save changes"
        confirmButtonClassName="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600 text-white"
        onConfirm={performSaveSettings}
      />

      <ConfirmDialog
        open={announcementPublishConfirmOpen}
        onOpenChange={setAnnouncementPublishConfirmOpen}
        title="Publish this announcement?"
        description={
          <span>
            This will broadcast “<strong>{newAnnouncement.title || 'Untitled'}</strong>” to users. Priority:{' '}
            <strong>{newAnnouncement.priority}</strong>.
          </span>
        }
        confirmLabel="Yes, publish"
        onConfirm={performPublishAnnouncement}
      />

      <ConfirmDialog
        open={!!announcementPendingDelete}
        onOpenChange={(open) => !open && setAnnouncementPendingDelete(null)}
        variant="destructive"
        title="Delete this announcement?"
        description={
          announcementPendingDelete ? (
            <span>
              Remove “<strong>{announcementPendingDelete.title}</strong>” permanently? This cannot be undone.
            </span>
          ) : null
        }
        confirmLabel="Delete announcement"
        onConfirm={performDeleteAnnouncement}
      />
    </div>
  );
};