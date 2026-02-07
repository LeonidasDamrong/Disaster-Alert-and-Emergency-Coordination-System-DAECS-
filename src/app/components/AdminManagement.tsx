import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Plus, Clock, Settings, Bell, Pencil, Trash2 } from 'lucide-react';
import { mockSystemSettings, mockAnnouncements } from '../lib/mockData';
import { User, UserRole, AuditLog, Announcement } from '../lib/types';
import { toast } from 'sonner';
import { authApi, auditLogApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const AdminManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: '',
    password: '',
    name: '',
    role: 'Emergency Officer' as UserRole,
    email: '',
    phone: ''
  });

  // Fetch users, roles, and audit logs from database on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingUsers(true);
        const [usersData, rolesData] = await Promise.all([
          authApi.getAllUsers(),
          authApi.getRoles()
        ]);
        setUsers(usersData);
        const roleList = rolesData.length > 0 ? rolesData : ['Emergency Officer', 'Shelter Manager', 'Resource Manager'];
        setRoles(roleList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setRoles(['Emergency Officer', 'Shelter Manager', 'Resource Manager']);
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

  // Set default role when roles load and current role may not exist
  useEffect(() => {
    if (roles.length > 0 && !roles.includes(newUser.role)) {
      setNewUser((prev) => ({ ...prev, role: roles[0] as UserRole }));
    }
  }, [roles]);

  // Auto-generate User ID when role changes during user creation
  useEffect(() => {
    if (isDialogOpen && newUser.role) {
      authApi.getNextUserId(newUser.role)
        .then((res) => setNewUser((prev) => ({ ...prev, userId: res.nextUserId })))
        .catch(() => { });
    }
  }, [isDialogOpen, newUser.role]);

  const handleCreateUser = async () => {
    setIsCreatingUser(true);

    try {
      // Call the backend API to create user
      await authApi.register({
        userId: newUser.userId,
        password: newUser.password,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      });

      // Only refresh if registration succeeded
      const updatedUsers = await authApi.getAllUsers();
      setUsers(updatedUsers);

      // Reset form
      setNewUser({
        userId: '',
        password: '',
        name: '',
        role: 'Emergency Officer',
        email: '',
        phone: ''
      });

      // Close dialog and show success message
      setIsDialogOpen(false);
      toast.success('User created successfully and saved to database');

      // Refresh audit logs
      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);

    } catch (error) {
      // Handle errors - DO NOT refresh user list on error
      let errorMessage = 'Failed to create user';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide helpful hints for common errors
        if (errorMessage.includes('password') || errorMessage.includes('Password')) {
          errorMessage += '\n\nPassword must have:\n• At least 6 characters\n• Uppercase letter (A-Z)\n• Lowercase letter (a-z)\n• Number (0-9)';
        }
      }

      toast.error(errorMessage);
      console.error('Error creating user:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
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

      // Refresh audit logs
      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);

      toast.success('User updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsEditingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.userId})?`)) return;
    try {
      await authApi.deleteUser(user.userId);
      const updatedUsers = await authApi.getAllUsers();
      setUsers(updatedUsers);

      // Refresh audit logs
      const updatedAuditLogs = await auditLogApi.getAuditLogs();
      setAuditLogs(updatedAuditLogs);

      toast.success('User deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Emergency Officer': return 'bg-blue-100 text-blue-800';
      case 'Shelter Manager': return 'bg-green-100 text-green-800';
      case 'Resource Manager': return 'bg-purple-100 text-purple-800';
      case 'Disaster Manager': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Management</h2>
          <p className="text-gray-600">System administration and configuration</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Clock className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Bell className="h-4 w-4" />
            Announcements
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
                <p className="text-sm text-gray-600">Officers</p>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'Emergency Officer').length}</p>
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
                      <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>User ID *</Label>
                          <Input
                            value={newUser.userId}
                            placeholder="Auto-generated"
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500">Auto-generated based on selected role</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Password *</Label>
                          <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="********"
                            disabled={isCreatingUser}
                          />
                          <p className="text-xs text-gray-500">
                            Min 6 chars, must include uppercase, lowercase, and number
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Enter full name"
                          disabled={isCreatingUser}
                        />
                      </div>
                      <div className="space-y-2">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="email@daecs.gov.my"
                            disabled={isCreatingUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input
                            value={newUser.phone}
                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            placeholder="+60..."
                            disabled={isCreatingUser}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateUser}
                        className="w-full"
                        disabled={!newUser.userId || !newUser.password || !newUser.name || !newUser.email || !newUser.phone || isCreatingUser}
                      >
                        {isCreatingUser ? 'Creating User...' : 'Create User Account'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Edit User Dialog */}
              <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
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
                        <Label>Full Name *</Label>
                        <Input
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          placeholder="Enter full name"
                          disabled={isEditingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          placeholder="email@daecs.gov.my"
                          disabled={isEditingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input
                          value={editingUser.phone}
                          onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                          placeholder="+60..."
                          disabled={isEditingUser}
                        />
                      </div>
                      <Button
                        onClick={handleUpdateUser}
                        className="w-full"
                        disabled={!editingUser.name || !editingUser.email || !editingUser.phone || isEditingUser}
                      >
                        {isEditingUser ? 'Updating...' : 'Update User'}
                      </Button>
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
                  {users
                    .filter((user) => user.name !== 'System Administrator')
                    .map((user) => (
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser({ ...user })}
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
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
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
                      <TableHead>User</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString('en-MY')}
                        </TableCell>
                        <TableCell className="font-semibold">{log.userName}</TableCell>
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
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Input value={mockSystemSettings.systemName} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={mockSystemSettings.organizationName} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Number</Label>
                  <Input value={mockSystemSettings.emergencyContactNumber} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Notifications Enabled</Label>
                  <Input value={mockSystemSettings.enableNotifications ? 'Yes' : 'No'} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>System Announcements</CardTitle>
              <CardDescription>Manage system-wide announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <Badge variant={announcement.active ? 'default' : 'secondary'}>
                            {announcement.active ? 'Active' : 'Inactive'}
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};