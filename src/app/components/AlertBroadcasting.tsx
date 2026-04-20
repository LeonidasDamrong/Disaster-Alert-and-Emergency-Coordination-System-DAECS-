import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Send, Calendar, XCircle, Loader2, CheckCircle, ClipboardList, Pencil } from 'lucide-react';
import { alertApi, victimReportApi } from '../lib/api';
import type { Alert as AlertType, AlertType as SeverityType, AlertStatus, VictimReport } from '../lib/types';
import { toast } from 'sonner';
import { useIsMobile } from './ui/use-mobile';
import { useAuth } from '../context/AuthContext';
import { sortByIdDesc } from '../lib/sort';
import { ConfirmDialog } from './ConfirmDialog';

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Earliest selectable value for datetime-local inputs (user's local clock). */
function datetimeLocalMinNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isFutureLocalDatetime(isoOrLocal: string): boolean {
  const t = new Date(isoOrLocal);
  if (Number.isNaN(t.getTime())) return false;
  return t.getTime() > Date.now();
}

const typeShort: Record<string, string> = { Emergency: 'Emerg', Warning: 'Warn', Information: 'Info', 'All Clear': 'Clear' };
const statusShort: Record<string, string> = { Sent: 'Sent', Scheduled: 'Sched', Canceled: 'Canc' };

function severityToAlertType(severity: string): SeverityType {
  const s = severity.trim().toLowerCase();
  if (s === 'critical') return 'Emergency';
  if (s === 'low') return 'Information';
  return 'Warning';
}

function buildDefaultAlertMessage(r: VictimReport): string {
  const parts = [r.description.trim()];
  if (r.category?.trim()) parts.push(`Category: ${r.category}`);
  if (r.safetyInfo?.trim()) parts.push(r.safetyInfo.trim());
  parts.push(`Location: ${r.locationName} (${r.lat}, ${r.lng})`);
  return parts.join('\n\n');
} 

export const AlertBroadcasting = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const userRoleRef = useRef(user?.role);
  userRoleRef.current = user?.role;
  const canModerateVictimReports = user?.role === 'Admin' || user?.role === 'System Admin';

  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertDetailsOpen, setAlertDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'Information' as SeverityType,
    targetAudience: '',
    scheduled: false,
    scheduledFor: ''
  });

  const [pendingReports, setPendingReports] = useState<VictimReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [approveReport, setApproveReport] = useState<VictimReport | null>(null);
  const [approveForm, setApproveForm] = useState({
    title: '',
    message: '',
    type: 'Information' as SeverityType,
    targetAudience: '',
    scheduledFor: ''
  });
  const [rejectReport, setRejectReport] = useState<VictimReport | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reportActionLoading, setReportActionLoading] = useState(false);

  const [createImmediateConfirmOpen, setCreateImmediateConfirmOpen] = useState(false);
  const [createScheduleConfirmOpen, setCreateScheduleConfirmOpen] = useState(false);
  const [broadcastNowAlertId, setBroadcastNowAlertId] = useState<string | null>(null);
  const [cancelScheduledAlertId, setCancelScheduledAlertId] = useState<string | null>(null);
  const [editScheduledAlert, setEditScheduledAlert] = useState<AlertType | null>(null);
  const [editScheduledForm, setEditScheduledForm] = useState({
    title: '',
    message: '',
    type: 'Information' as SeverityType,
    targetAudience: '',
    scheduledFor: '',
  });
  const [editScheduledSaveConfirmOpen, setEditScheduledSaveConfirmOpen] = useState(false);
  const [editScheduledSubmitting, setEditScheduledSubmitting] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertApi.getAll();
      setAlerts(data.map(a => {
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

  const fetchPendingReports = async () => {
    try {
      setLoadingReports(true);
      const data = await victimReportApi.list('Pending');
      setPendingReports(data);
    } catch (err) {
      console.error('Failed to fetch victim reports:', err);
      toast.error('Failed to load pending reports');
      setPendingReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    void fetchAlerts();
    const mod = user?.role === 'Admin' || user?.role === 'System Admin';
    if (mod) void fetchPendingReports();
    else {
      setLoadingReports(false);
      setPendingReports([]);
    }
  }, [user?.role]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchAlerts();
      const r = userRoleRef.current;
      if (r === 'Admin' || r === 'System Admin') void fetchPendingReports();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const openApprove = (r: VictimReport) => {
    setApproveReport(r);
    setApproveForm({
      title: r.title,
      message: buildDefaultAlertMessage(r),
      type: severityToAlertType(r.severity),
      targetAudience: r.locationName,
      scheduledFor: ''
    });
  };

  const handleApproveSubmit = async () => {
    if (!approveReport) return;
    if (!approveForm.title.trim() || !approveForm.message.trim() || !approveForm.targetAudience.trim()) {
      toast.error('Title, message, and target audience are required');
      return;
    }
    try {
      setReportActionLoading(true);
      await victimReportApi.approve(approveReport.id, {
        title: approveForm.title,
        message: approveForm.message,
        type: approveForm.type,
        targetAudience: approveForm.targetAudience,
        scheduledFor: approveForm.scheduledFor ? approveForm.scheduledFor : null
      });
      toast.success(approveForm.scheduledFor ? 'Report approved — alert scheduled.' : 'Report approved and broadcast as alert.');
      setApproveReport(null);
      await fetchPendingReports();
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve report');
    } finally {
      setReportActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReport) return;
    try {
      setReportActionLoading(true);
      await victimReportApi.reject(rejectReport.id, rejectReason || undefined);
      toast.success('Report rejected');
      setRejectReport(null);
      setRejectReason('');
      await fetchPendingReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject report');
    } finally {
      setReportActionLoading(false);
    }
  };

  const validateCreateFields = (immediate: boolean): boolean => {
    if (!newAlert.title?.trim() || !newAlert.message?.trim() || !newAlert.targetAudience?.trim()) {
      toast.error('Please fill in Title, Message, and Target Audience');
      return false;
    }
    if (!immediate) {
      if (!newAlert.scheduledFor?.trim()) {
        toast.error('Please select a date/time for scheduled broadcast');
        return false;
      }
      if (!isFutureLocalDatetime(newAlert.scheduledFor)) {
        toast.error('Scheduled time must be in the future.');
        return false;
      }
    }
    return true;
  };

  const executeCreateAlert = async (immediate: boolean) => {
    try {
      setIsSubmitting(true);
      await alertApi.create({
        title: newAlert.title,
        message: newAlert.message,
        type: newAlert.type,
        targetAudience: newAlert.targetAudience,
        scheduledFor: immediate ? null : newAlert.scheduledFor || null,
      });
      setIsCreateDialogOpen(false);
      setCreateImmediateConfirmOpen(false);
      setCreateScheduleConfirmOpen(false);
      setNewAlert({
        title: '',
        message: '',
        type: 'Information',
        targetAudience: '',
        scheduled: false,
        scheduledFor: '',
      });
      toast.success(immediate ? 'Alert broadcast successfully!' : 'Alert scheduled successfully!');
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create alert');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeBroadcastNow = async () => {
    if (!broadcastNowAlertId) return;
    try {
      await alertApi.broadcast(broadcastNowAlertId);
      toast.success('Alert broadcast successfully!');
      setBroadcastNowAlertId(null);
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to broadcast alert');
      throw err;
    }
  };

  const executeCancelScheduled = async () => {
    if (!cancelScheduledAlertId) return;
    try {
      await alertApi.cancel(cancelScheduledAlertId);
      toast.success('Scheduled alert canceled');
      setCancelScheduledAlertId(null);
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel alert');
      throw err;
    }
  };

  const openEditScheduled = (alert: AlertType) => {
    setEditScheduledAlert(alert);
    setEditScheduledForm({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      targetAudience: alert.targetAudience,
      scheduledFor: alert.scheduledFor ? isoToDatetimeLocal(alert.scheduledFor) : '',
    });
  };

  const executeEditScheduled = async () => {
    if (!editScheduledAlert) return;
    if (
      !editScheduledForm.title.trim() ||
      !editScheduledForm.message.trim() ||
      !editScheduledForm.targetAudience.trim() ||
      !editScheduledForm.scheduledFor
    ) {
      toast.error('Title, message, target audience, and scheduled time are required');
      throw new Error('Validation');
    }
    if (!isFutureLocalDatetime(editScheduledForm.scheduledFor)) {
      toast.error('Scheduled time must be in the future.');
      throw new Error('Validation');
    }
    try {
      setEditScheduledSubmitting(true);
      await alertApi.update(editScheduledAlert.id, {
        title: editScheduledForm.title.trim(),
        message: editScheduledForm.message.trim(),
        type: editScheduledForm.type,
        targetAudience: editScheduledForm.targetAudience.trim(),
        scheduledFor: editScheduledForm.scheduledFor,
      });
      toast.success('Scheduled alert updated');
      setEditScheduledSaveConfirmOpen(false);
      setEditScheduledAlert(null);
      await fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update alert');
      throw err;
    } finally {
      setEditScheduledSubmitting(false);
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

  const formatWhen = (iso?: string) => iso ? new Date(iso).toLocaleString('en-MY') : '—';

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-hidden">
      <Dialog
        open={alertDetailsOpen}
        onOpenChange={(o) => {
          setAlertDetailsOpen(o);
          if (!o) {
            // Let the close animation finish before clearing content
            window.setTimeout(() => setSelectedAlert(null), 180);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alert details</DialogTitle>
            <DialogDescription>Full alert payload as stored in the system.</DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{selectedAlert.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm font-semibold">{selectedAlert.title}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge className={`${getAlertTypeColor(selectedAlert.type)} border text-xs w-fit`}>
                    {selectedAlert.type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={
                    selectedAlert.status === 'Sent' ? 'default' :
                      selectedAlert.status === 'Scheduled' ? 'secondary' :
                        'outline'
                  } className="text-xs w-fit">
                    {selectedAlert.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Target audience</p>
                <p className="text-sm">{selectedAlert.targetAudience}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Message</p>
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="text-sm whitespace-pre-wrap break-words">{selectedAlert.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p>{selectedAlert.createdBy || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created at</p>
                  <p>{formatWhen(selectedAlert.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Scheduled for</p>
                  <p>{formatWhen(selectedAlert.scheduledFor)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sent at</p>
                  <p>{formatWhen(selectedAlert.sentAt)}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setAlertDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  min={datetimeLocalMinNow()}
                  value={newAlert.scheduledFor}
                  onChange={(e) => setNewAlert({ ...newAlert, scheduledFor: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    if (!validateCreateFields(true)) return;
                    setCreateImmediateConfirmOpen(true);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                  disabled={!newAlert.title || !newAlert.message || !newAlert.targetAudience || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Broadcast Immediately
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!validateCreateFields(false)) return;
                    setCreateScheduleConfirmOpen(true);
                  }}
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

      {canModerateVictimReports && (
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg sm:text-xl">Pending victim reports</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Review community submissions. Approving broadcasts only the alert fields below (title, message, type, audience). Evidence and reporter details stay in the report record. (Admin only.)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0">
          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : pendingReports.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 sm:px-0 py-4">No pending reports.</p>
          ) : (
            <div className="overflow-x-auto w-full -mx-px sm:mx-0">
              <Table className="w-full min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead className="min-w-[120px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="min-w-[100px]">Location</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead className="whitespace-nowrap">Submitted</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortByIdDesc(pendingReports, (x) => x.id).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="text-sm font-medium truncate max-w-[160px]" title={r.title}>{r.title}</TableCell>
                      <TableCell className="text-xs">{r.category}</TableCell>
                      <TableCell className="text-xs">{r.severity}</TableCell>
                      <TableCell className="text-xs truncate max-w-[140px]" title={r.locationName}>{r.locationName}</TableCell>
                      <TableCell className="text-xs">
                        <div className="truncate max-w-[120px]" title={r.reporterEmail || r.reporterName}>
                          {r.reporterName || '—'}
                          {r.reporterEmail ? <span className="block text-muted-foreground truncate">{r.reporterEmail}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString('en-MY')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 gap-1" onClick={() => openApprove(r)}>
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 gap-1" onClick={() => setRejectReport(r)}>
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {canModerateVictimReports && (
      <>
      <Dialog open={!!approveReport} onOpenChange={(o) => !o && setApproveReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve &amp; broadcast alert</DialogTitle>
            <DialogDescription>
              Edit the broadcast payload if needed. This is what subscribers receive — not the full report (images stay internal unless you paste links in the message).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Alert title *</Label>
              <Input value={approveForm.title} onChange={(e) => setApproveForm({ ...approveForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Alert message *</Label>
              <Textarea rows={6} value={approveForm.message} onChange={(e) => setApproveForm({ ...approveForm, message: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert type *</Label>
                <Select value={approveForm.type} onValueChange={(v) => setApproveForm({ ...approveForm, type: v as SeverityType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Information">Information</SelectItem>
                    <SelectItem value="All Clear">All Clear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target audience *</Label>
                <Input value={approveForm.targetAudience} onChange={(e) => setApproveForm({ ...approveForm, targetAudience: e.target.value })} placeholder="e.g. area or district" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Schedule broadcast (optional)</Label>
              <Input
                type="datetime-local"
                min={datetimeLocalMinNow()}
                value={approveForm.scheduledFor}
                onChange={(e) => setApproveForm({ ...approveForm, scheduledFor: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setApproveReport(null)} disabled={reportActionLoading}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveSubmit} disabled={reportActionLoading}>
                {reportActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {approveForm.scheduledFor ? 'Approve & schedule' : 'Approve & broadcast'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectReport} onOpenChange={(o) => { if (!o) { setRejectReport(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject report</DialogTitle>
            <DialogDescription>
              {rejectReport ? `Reject ${rejectReport.id}: ${rejectReport.title}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setRejectReport(null); setRejectReason(''); }} disabled={reportActionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={reportActionLoading}>
              {reportActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}

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
                    sortByIdDesc(alerts, (a) => a.id).map((alert) => (
                      <TableRow
                        key={alert.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setAlertDetailsOpen(true);
                        }}
                        title="Click to view details"
                      >
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
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditScheduled(alert);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-1 text-xs h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBroadcastNowAlertId(alert.id);
                                }}
                              >
                                <Send className="h-3 w-3" />
                                Now
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelScheduledAlertId(alert.id);
                                }}
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

      <Dialog
        open={!!editScheduledAlert}
        onOpenChange={(o) => {
          if (!o && !editScheduledSubmitting) {
            setEditScheduledAlert(null);
            setEditScheduledSaveConfirmOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit scheduled alert</DialogTitle>
            <DialogDescription>
              Update content or schedule before it is broadcast. Sent alerts cannot be edited here.
            </DialogDescription>
          </DialogHeader>
          {editScheduledAlert && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Alert title *</Label>
                <Input
                  value={editScheduledForm.title}
                  onChange={(e) => setEditScheduledForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={editScheduledSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Alert message *</Label>
                <Textarea
                  rows={5}
                  value={editScheduledForm.message}
                  onChange={(e) => setEditScheduledForm((f) => ({ ...f, message: e.target.value }))}
                  disabled={editScheduledSubmitting}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert type *</Label>
                  <Select
                    value={editScheduledForm.type}
                    onValueChange={(v) => setEditScheduledForm((f) => ({ ...f, type: v as SeverityType }))}
                    disabled={editScheduledSubmitting}
                  >
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
                  <Label>Target audience *</Label>
                  <Input
                    value={editScheduledForm.targetAudience}
                    onChange={(e) => setEditScheduledForm((f) => ({ ...f, targetAudience: e.target.value }))}
                    disabled={editScheduledSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scheduled for *</Label>
                <Input
                  type="datetime-local"
                  min={datetimeLocalMinNow()}
                  value={editScheduledForm.scheduledFor}
                  onChange={(e) => setEditScheduledForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                  disabled={editScheduledSubmitting}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditScheduledAlert(null)}
                  disabled={editScheduledSubmitting}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => setEditScheduledSaveConfirmOpen(true)}
                  disabled={editScheduledSubmitting}
                >
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={createImmediateConfirmOpen}
        onOpenChange={setCreateImmediateConfirmOpen}
        title="Broadcast this alert immediately?"
        description={
          <span>
            Subscribers will receive “<strong>{newAlert.title.trim() || 'this alert'}</strong>” right away.
          </span>
        }
        confirmLabel="Broadcast now"
        variant="primary"
        onConfirm={() => executeCreateAlert(true)}
      />

      <ConfirmDialog
        open={createScheduleConfirmOpen}
        onOpenChange={setCreateScheduleConfirmOpen}
        title="Schedule this alert?"
        description={
          <span>
            “<strong>{newAlert.title.trim() || 'This alert'}</strong>” will be sent at{' '}
            <strong>
              {newAlert.scheduledFor
                ? new Date(newAlert.scheduledFor).toLocaleString('en-MY')
                : '—'}
            </strong>{' '}
            (local time).
          </span>
        }
        confirmLabel="Schedule"
        variant="primary"
        onConfirm={() => executeCreateAlert(false)}
      />

      <ConfirmDialog
        open={!!broadcastNowAlertId}
        onOpenChange={(o) => !o && setBroadcastNowAlertId(null)}
        title="Send this scheduled alert now?"
        description={
          broadcastNowAlertId ? (
            <span>
              Broadcast “
              <strong>{alerts.find((a) => a.id === broadcastNowAlertId)?.title ?? 'this alert'}</strong>”
              immediately? The planned send time will be skipped.
            </span>
          ) : null
        }
        confirmLabel="Broadcast now"
        variant="primary"
        onConfirm={executeBroadcastNow}
      />

      <ConfirmDialog
        open={!!cancelScheduledAlertId}
        onOpenChange={(o) => !o && setCancelScheduledAlertId(null)}
        title="Cancel this scheduled alert?"
        description={
          cancelScheduledAlertId ? (
            <span>
              “
              <strong>{alerts.find((a) => a.id === cancelScheduledAlertId)?.title ?? 'This alert'}</strong>”
              will not be sent. It will be marked as canceled.
            </span>
          ) : null
        }
        confirmLabel="Yes, cancel"
        variant="destructive"
        onConfirm={executeCancelScheduled}
      />

      <ConfirmDialog
        open={editScheduledSaveConfirmOpen}
        onOpenChange={setEditScheduledSaveConfirmOpen}
        title="Save changes to this scheduled alert?"
        description="The updated title, message, audience, and schedule time will replace what is stored for this alert."
        confirmLabel="Save changes"
        variant="primary"
        onConfirm={executeEditScheduled}
      />
    </div>
  );
};
