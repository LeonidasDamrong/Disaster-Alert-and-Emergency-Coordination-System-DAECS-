import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Plus, Clock, Settings, Bell } from 'lucide-react';
import { mockUsers, mockAuditLogs, mockSystemSettings, mockAnnouncements } from '../lib/mockData';
import { User, UserRole, AuditLog, Announcement } from '../lib/types';
import { toast } from 'sonner';

export const AdminManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [newUser, setNewUser] = useState({
    userId: '',
    password: '',
    name: '',
    role: 'Emergency Officer' as UserRole,
    email: '',
    phone: ''
  });

  const handleCreateUser = () => {
    const user: User = {
      id: `${Date.now()}`,
      ...newUser,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({
      userId: '',
      password: '',
      name: '',
      role: 'Emergency Officer',
      email: '',
      phone: ''
    });
    toast.success('User created successfully');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Emergency Officer': return 'bg-blue-100 text-blue-800';
      case 'Shelter Manager': return 'bg-green-100 text-green-800';
      case 'Resource Manager': return 'bg-purple-100 text-purple-800';
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
                <Dialog>
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
                            onChange={(e) => setNewUser({...newUser, userId: e.target.value})}
                            placeholder="officer002"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password *</Label>
                          <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            placeholder="********"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Emergency Officer">Emergency Officer</SelectItem>
                            <SelectItem value="Shelter Manager">Shelter Manager</SelectItem>
                            <SelectItem value="Resource Manager">Resource Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="email@daecs.gov.my"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input
                            value={newUser.phone}
                            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                            placeholder="+60..."
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateUser}
                        className="w-full"
                        disabled={!newUser.userId || !newUser.password || !newUser.name || !newUser.email || !newUser.phone}
                      >
                        Create User Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
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
                        {new Date(user.createdAt).toLocaleDateString('en-MY')}
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
