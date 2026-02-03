import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Send, Calendar, XCircle } from 'lucide-react';
import { mockAlerts } from '../lib/mockData';
import { Alert, AlertType, AlertStatus } from '../lib/types';
import { toast } from 'sonner';

export const AlertBroadcasting = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'Information' as AlertType,
    targetAudience: '',
    scheduled: false,
    scheduledFor: ''
  });

  const handleCreateAlert = (immediate: boolean) => {
    const alert: Alert = {
      id: `ALERT${Date.now()}`,
      title: newAlert.title,
      message: newAlert.message,
      type: newAlert.type,
      targetAudience: newAlert.targetAudience,
      status: immediate ? 'Sent' : 'Scheduled',
      createdBy: 'Ahmad bin Abdullah',
      createdAt: new Date().toISOString(),
      ...(immediate ? { sentAt: new Date().toISOString() } : { scheduledFor: newAlert.scheduledFor })
    };

    setAlerts(prev => [alert, ...prev]);
    setIsCreateDialogOpen(false);
    setNewAlert({
      title: '',
      message: '',
      type: 'Information',
      targetAudience: '',
      scheduled: false,
      scheduledFor: ''
    });
    toast.success(immediate ? 'Alert broadcasted successfully!' : 'Alert scheduled successfully!');
  };

  const handleCancelAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'Canceled' as AlertStatus } : alert
      )
    );
    toast.success('Alert canceled');
  };

  const getAlertTypeColor = (type: AlertType) => {
    switch (type) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'Warning': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Information': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'All Clear': return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Alert Broadcasting</h2>
          <p className="text-gray-600">Create and manage emergency alerts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
              <AlertTriangle className="h-4 w-4" />
              Create New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
              <DialogDescription>Broadcast emergency information to target audience</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alert Title *</Label>
                <Input
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="Enter alert title"
                />
              </div>
              <div className="space-y-2">
                <Label>Alert Message *</Label>
                <Textarea
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  placeholder="Enter detailed alert message"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert Type *</Label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value as AlertType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Information">Information</SelectItem>
                      <SelectItem value="All Clear">All Clear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience *</Label>
                  <Input
                    value={newAlert.targetAudience}
                    onChange={(e) => setNewAlert({ ...newAlert, targetAudience: e.target.value })}
                    placeholder="e.g., Kuala Lumpur, All Districts"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Broadcast (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAlert.scheduledFor}
                  onChange={(e) => setNewAlert({ ...newAlert, scheduledFor: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleCreateAlert(true)}
                  className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                  disabled={!newAlert.title || !newAlert.message || !newAlert.targetAudience}
                >
                  <Send className="h-4 w-4" />
                  Broadcast Immediately
                </Button>
                <Button
                  onClick={() => handleCreateAlert(false)}
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={!newAlert.title || !newAlert.message || !newAlert.targetAudience || !newAlert.scheduledFor}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Broadcast
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Sent Alerts</p>
            <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.status === 'Sent').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.status === 'Scheduled').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Canceled</p>
            <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.status === 'Canceled').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Alerts</p>
            <p className="text-3xl font-bold mt-1">{alerts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>Sent, scheduled, and canceled alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-mono">{alert.id}</TableCell>
                  <TableCell className="font-semibold">{alert.title}</TableCell>
                  <TableCell>
                    <Badge className={`${getAlertTypeColor(alert.type)} border`}>
                      {alert.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.targetAudience}</TableCell>
                  <TableCell>
                    <Badge variant={
                      alert.status === 'Sent' ? 'default' :
                        alert.status === 'Scheduled' ? 'secondary' :
                          'outline'
                    }>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {alert.sentAt && `Sent: ${new Date(alert.sentAt).toLocaleString('en-MY')}`}
                    {alert.scheduledFor && `Scheduled: ${new Date(alert.scheduledFor).toLocaleString('en-MY')}`}
                    {!alert.sentAt && !alert.scheduledFor && `Created: ${new Date(alert.createdAt).toLocaleString('en-MY')}`}
                  </TableCell>
                  <TableCell>
                    {alert.status === 'Scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCancelAlert(alert.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};