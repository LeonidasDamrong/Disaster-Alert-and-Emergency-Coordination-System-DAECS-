import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Send, Calendar, XCircle, Loader2 } from 'lucide-react';
import { alertApi } from '../lib/api';
import type { Alert as AlertType, AlertType as SeverityType, AlertStatus } from '../lib/types';
import { toast } from 'sonner';
import { useIsMobile } from './ui/use-mobile';

const typeShort: Record<string, string> = { Emergency: 'Emerg', Warning: 'Warn', Information: 'Info', 'All Clear': 'Clear' };
const statusShort: Record<string, string> = { Sent: 'Sent', Scheduled: 'Sched', Canceled: 'Canc' };

export const AlertBroadcasting = () => {
  const isMobile = useIsMobile();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'Information' as SeverityType,
    targetAudience: '',
    scheduled: false,
    scheduledFor: ''
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertApi.getAll();
      setAlerts(data.map(a => {
        // #region agent log
        const raw = a.scheduledFor ?? a.sentAt ?? a.createdAt;
        if (raw) {
          const d = new Date(raw);
          fetch('http://127.0.0.1:7242/ingest/ea7a769f-3d28-4b8f-a0ad-ba511068bb19',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AlertBroadcasting.tsx:fetchAlerts',message:'datetime display',data:{rawFromApi:raw,displayed:raw ? d.toLocaleString('en-MY') : null,tzOffset:new Date().getTimezoneOffset()},timestamp:Date.now(),hypothesisId:'H3,H4'})}).catch(()=>{});
        }
        // #endregion
        return {
          id: a.id,
          title: a.title,
          message: a.message,
          type: a.type as SeverityType,
          targetAudience: a.targetAudience,
          status: a.status as AlertStatus,
          createdBy: a.createdBy,
          createdAt: a.createdAt,
          scheduledFor: a.scheduledFor ?? undefined,
          sentAt: a.sentAt ?? undefined
        };
      }));
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      toast.error('Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refetch every 30s so auto-broadcasts appear
    return () => clearInterval(interval);
  }, []);

  const handleCreateAlert = async (immediate: boolean) => {
    if (!newAlert.title || !newAlert.message || !newAlert.targetAudience) {
      toast.error('Please fill in Title, Message, and Target Audience');
      return;
    }
    if (!immediate && !newAlert.scheduledFor) {
      toast.error('Please select a date/time for scheduled broadcast');
      return;
    }
    try {
      setIsSubmitting(true);
      await alertApi.create({
        title: newAlert.title,
        message: newAlert.message,
        type: newAlert.type,
        targetAudience: newAlert.targetAudience,
        scheduledFor: immediate ? null : newAlert.scheduledFor || null
      });
      setIsCreateDialogOpen(false);
      setNewAlert({
        title: '',
        message: '',
        type: 'Information',
        targetAudience: '',
        scheduled: false,
        scheduledFor: ''
      });
      toast.success(immediate ? 'Alert broadcast successfully!' : 'Alert scheduled successfully!');
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAlert = async (alertId: string) => {
    try {
      await alertApi.cancel(alertId);
      toast.success('Alert canceled');
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel alert');
    }
  };

  const handleBroadcastNow = async (alertId: string) => {
    try {
      await alertApi.broadcast(alertId);
      toast.success('Alert broadcast successfully!');
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to broadcast alert');
    }
  };

  const getAlertTypeColor = (type: SeverityType) => {
    switch (type) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'Warning': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Information': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'All Clear': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const typeLabel = (type: string) => (isMobile && typeShort[type]) ? typeShort[type] : type;
  const statusLabel = (status: string) => (isMobile && statusShort[status]) ? statusShort[status] : status;

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-3xl font-bold truncate">Alert Broadcasting</h2>
          <p className="text-sm text-gray-600">Create and manage emergency alerts</p>
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
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value as SeverityType })}>
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
                  disabled={!newAlert.title || !newAlert.message || !newAlert.targetAudience || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Broadcast Immediately
                </Button>
                <Button
                  onClick={() => handleCreateAlert(false)}
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={!newAlert.title || !newAlert.message || !newAlert.targetAudience || !newAlert.scheduledFor || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
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

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Alert History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Sent, scheduled, and canceled alerts from database</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto w-full -mx-px sm:mx-0">
              <Table className="w-full min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 whitespace-nowrap">ID</TableHead>
                    <TableHead className="min-w-[100px] max-w-[140px]">Title</TableHead>
                    <TableHead className="w-20 sm:w-24 whitespace-nowrap">Type</TableHead>
                    <TableHead className="min-w-0 max-w-[100px] sm:max-w-[120px]">Audience</TableHead>
                    <TableHead className="w-20 sm:w-24 whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-36 sm:w-40 whitespace-nowrap">Timestamp</TableHead>
                    <TableHead className="w-32 sm:w-44 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-sm">
                        No alerts found. Create your first alert to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono text-xs truncate">{alert.id}</TableCell>
                        <TableCell className="font-semibold text-sm truncate max-w-[140px]" title={alert.title}>{alert.title}</TableCell>
                        <TableCell>
                          <Badge className={`${getAlertTypeColor(alert.type)} border text-xs whitespace-nowrap`} title={alert.type}>
                            {typeLabel(alert.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]" title={alert.targetAudience}>{alert.targetAudience}</TableCell>
                        <TableCell>
                          <Badge variant={
                            alert.status === 'Sent' ? 'default' :
                              alert.status === 'Scheduled' ? 'secondary' :
                                'outline'
                          } className="text-xs whitespace-nowrap" title={alert.status}>
                            {statusLabel(alert.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {alert.sentAt && (isMobile ? `Sent: ${new Date(alert.sentAt).toLocaleDateString('en-MY')} ${new Date(alert.sentAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}` : `Sent: ${new Date(alert.sentAt).toLocaleString('en-MY')}`)}
                          {alert.scheduledFor && !alert.sentAt && (isMobile ? `Sched: ${new Date(alert.scheduledFor).toLocaleDateString('en-MY')}` : `Sched: ${new Date(alert.scheduledFor).toLocaleString('en-MY')}`)}
                          {!alert.sentAt && !alert.scheduledFor && (isMobile ? `Created: ${new Date(alert.createdAt).toLocaleDateString('en-MY')}` : `Created: ${new Date(alert.createdAt).toLocaleString('en-MY')}`)}
                        </TableCell>
                        <TableCell>
                          {alert.status === 'Scheduled' && (
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-1 text-xs h-7 px-2"
                                onClick={() => handleBroadcastNow(alert.id)}
                              >
                                <Send className="h-3 w-3" />
                                Now
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                                onClick={() => handleCancelAlert(alert.id)}
                              >
                                <XCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">Cancel</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
