import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Package, Printer, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { CheckCircle, XCircle } from 'lucide-react';
import { resourceApi, authApi, shelterApi } from '../lib/api';
import type { Resource, ResourceRequest, Warehouse, Driver, ResourceUsageReport, Shelter } from '../lib/types';
import { toast } from 'sonner';
import { useResourceSignalR } from '../hooks/useResourceSignalR';
import { PlacesAddressAutocomplete } from './PlacesAddressAutocomplete';
import { sortByIdDesc } from '../lib/sort';

interface OverallQuantityItem {
  name: string;
  type: string;
  unit: string;
  totalQuantity: number;
  byWarehouse: Array<{ warehouseId: string; warehouseName: string; totalQuantity: number }>;
}

export const ResourceManagement = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [myShelter, setMyShelter] = useState<Shelter | null>(null);
  const [resourceManagers, setResourceManagers] = useState<Array<{ userId: string; name: string }>>([]);
  const [overallQuantity, setOverallQuantity] = useState<OverallQuantityItem[] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [rejectionNote, setRejectionNote] = useState('');
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', managedBy: '' as string | null });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ResourceUsageReport[]>([]);

  const isAdmin = user?.role === 'Admin' || user?.role === 'System Admin';
  const isResourceManager = user?.role === 'Resource Manager';
  const isShelterManager = user?.role === 'Shelter Manager';

  useResourceSignalR(
    (payload) => {
      if (!isResourceManager) return;
      const urgencyLabel = (payload.urgency || 'Medium').toUpperCase();
      const description = `Request ${payload.id} from ${payload.requestedBy}${payload.destination ? ` • ${payload.destination}` : ''}`;
      if (String(payload.urgency).toLowerCase() === 'critical') {
        toast.error(`${urgencyLabel} resource request: ${payload.itemName} (${payload.quantity} ${payload.unit})`, { description });
      } else {
        toast.info(`${urgencyLabel} resource request: ${payload.itemName} (${payload.quantity} ${payload.unit})`, { description });
      }
      fetchData();
    },
    !!user
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resList, reqList, whList] = await Promise.all([
        resourceApi.getResources().catch(() => []),
        resourceApi.getResourceRequests(undefined, false).catch(() => []),
        resourceApi.getWarehouses().catch(() => []),
      ]);
      setResources(resList as Resource[]);
      setRequests(reqList as ResourceRequest[]);
      setWarehouses(whList as Warehouse[]);

      if (isShelterManager) {
        const s = await shelterApi.getMyShelter().catch(() => null);
        setMyShelter(s);
      } else {
        setMyShelter(null);
      }

      if (isAdmin) {
        const [qty, users] = await Promise.all([
          resourceApi.getOverallQuantity().catch(() => null),
          authApi.getAllUsers().catch(() => []),
        ]);
        setOverallQuantity(qty?.byItem ?? null);
        const rms = (users as Array<{ userId: string; name: string; role: string }>).filter((u) => u.role === 'Resource Manager');
        setResourceManagers(rms.map((u) => ({ userId: u.userId, name: u.name })));
      }

      if (isResourceManager) {
        const drv = await resourceApi.getDrivers().catch(() => []);
        setDrivers(drv as Driver[]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const filteredRequests = filterStatus === 'All'
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const sortedRequests = useMemo(() => {
    const extractNum = (id: string) => parseInt(id.replace(/\D/g, ''), 10) || 0;
    return [...filteredRequests].sort((a, b) => extractNum(b.resourceRequestId) - extractNum(a.resourceRequestId));
  }, [filteredRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!editWarehouse) return;
    try {
      await resourceApi.updateWarehouse(editWarehouse.warehouseId, {
        name: editForm.name,
        address: editForm.address,
        managedBy: editForm.managedBy === 'none' || !editForm.managedBy ? 'none' : editForm.managedBy,
      });
      toast.success('Warehouse updated');
      setEditWarehouse(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const openEditWarehouse = (wh: Warehouse) => {
    setEditWarehouse(wh);
    setEditForm({ name: wh.name, address: wh.address, managedBy: wh.managedBy ?? null });
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await resourceApi.approveResourceRequest(requestId);
      toast.success('Request approved');
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await resourceApi.rejectResourceRequest(requestId, rejectionNote);
      toast.success('Request rejected');
      setRejectionNote('');
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject');
    }
  };

  const handleAssignDriver = async (requestId: string, driverId: string) => {
    try {
      await resourceApi.assignDriver(requestId, driverId);
      toast.success('Driver assigned');
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign driver');
    }
  };

  const handleMarkDelivered = async (requestId: string) => {
    try {
      await resourceApi.markDelivered(requestId);
      toast.success('Marked as delivered');
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark delivered');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const data = await resourceApi.getUsageReport();
      setReportData(data);
      setShowReport(true);
      toast.success('Report generated successfully');
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const availableManagersForWarehouse = (currentWarehouseId: string) =>
    resourceManagers.filter(
      (m) => !warehouses.some((w) => w.managedBy === m.userId && w.warehouseId !== currentWarehouseId)
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Resource Management</h2>
          <p className="text-gray-600">
            {isAdmin && 'View resources, assign managers, generate reports'}
            {isResourceManager && 'Manage inventory, approve requests, assign drivers'}
            {!isAdmin && !isResourceManager && 'Request resources for your needs'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Resource Request Form - All Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Request Resource
              </CardTitle>
              <CardDescription>Submit a request for resource items. Available to all users.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceRequestForm
                resources={resources}
                onSuccess={fetchData}
                fixedDestination={isShelterManager && myShelter ? `${myShelter.name} • ${myShelter.location}` : null}
              />
            </CardContent>
          </Card>

          {/* Admin: Warehouse cards (shelter-like design), Overall Quantity, Report button */}
          {isAdmin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total Warehouses</p><p className="text-3xl font-bold mt-1">{warehouses.length}</p></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total Resources</p><p className="text-3xl font-bold mt-1">{resources.length}</p></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total Requests</p><p className="text-3xl font-bold mt-1">{requests.length}</p></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Warehouses & Manager Assignment</CardTitle>
                  <CardDescription>Assign resource managers to warehouses. One manager per warehouse.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {warehouses.map((wh) => (
                      <Card key={wh.warehouseId}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">{wh.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{wh.address}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => openEditWarehouse(wh)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div><p className="text-sm text-gray-600">Managed by</p><p className="font-semibold">{wh.managedBy ? (resourceManagers.find((rm) => rm.userId === wh.managedBy)?.name || wh.managedBy) : 'None'}</p></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Resource Quantity</CardTitle>
                  <CardDescription>Aggregated quantities across all warehouses</CardDescription>
                </CardHeader>
                <CardContent>
                  {overallQuantity && overallQuantity.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overallQuantity.map((item, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.type}</p>
                          <p className="text-2xl font-bold mt-1">{item.totalQuantity} {item.unit}</p>
                          {item.byWarehouse.length > 1 && (
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                              {item.byWarehouse.map((bw) => (
                                <p key={bw.warehouseId}>{bw.warehouseName}: {bw.totalQuantity} {item.unit}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No resources to display</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle>Resource Usage Report</CardTitle>
                      <CardDescription>Generate report for all resource warehouses</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleGenerateReport} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Requests (Excluding Pending)</CardTitle>
                  <CardDescription>View approved, rejected, and delivered requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResourceRequestsTable
                    requests={requests.filter((r) => r.status !== 'Pending')}
                    getStatusColor={getStatusColor}
                    getUrgencyColor={getUrgencyColor}
                  />
                </CardContent>
              </Card>

              {editWarehouse && (
                <Dialog open={!!editWarehouse} onOpenChange={(o) => !o && setEditWarehouse(null)}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Warehouse</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></div>
                      <div className="grid gap-2">
                        <Label>Address</Label>
                        <PlacesAddressAutocomplete
                          value={editForm.address}
                          onChange={(address) => setEditForm((f) => ({ ...f, address }))}
                          onPlaceResolved={() => { }}
                          placeholder="Search warehouse address (Malaysia)"
                        />
                      </div>
                      <div>
                        <Label>Assign manager</Label>
                        <Select value={editForm.managedBy ?? 'none'} onValueChange={(v) => setEditForm((f) => ({ ...f, managedBy: v === 'none' ? null : v }))}>
                          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {availableManagersForWarehouse(editWarehouse.warehouseId).map((m) => (
                              <SelectItem key={m.userId} value={m.userId}>{m.name} ({m.userId})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleUpdateWarehouse}>Save changes</Button>
                  </DialogContent>
                </Dialog>
              )}

            </>
          )}

          {/* Resource Manager: CRUD, Stock In, Approve/Reject, Assign Driver */}
          {isResourceManager && (
            <>
              <ResourceManagerCRUD
                resources={resources}
                warehouses={warehouses}
                onSuccess={fetchData}
                onGenerateReport={handleGenerateReport}
              />

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Resource Requests</CardTitle>
                      <CardDescription>Approve, reject, or assign drivers for your warehouse</CardDescription>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {sortedRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">There is no resource request</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRequests.map((req) => (
                          <TableRow key={req.resourceRequestId}>
                            <TableCell className="font-mono text-sm">{req.resourceRequestId}</TableCell>
                            <TableCell><div><p className="font-semibold">{req.itemName}</p><p className="text-xs text-gray-600">{req.type}</p></div></TableCell>
                            <TableCell>{req.quantity} {req.unit}</TableCell>
                            <TableCell>{req.destination}</TableCell>
                            <TableCell><Badge className={getUrgencyColor(req.urgency)}>{req.urgency}</Badge></TableCell>
                            <TableCell><Badge className={getStatusColor(req.status)}>{req.status}</Badge></TableCell>
                            <TableCell>
                              {req.status === 'Pending' && (
                                <Dialog>
                                  <DialogTrigger asChild><Button variant="outline" size="sm">Process</Button></DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Process Resource Request</DialogTitle><DialogDescription>{req.resourceRequestId}</DialogDescription></DialogHeader>
                                    <div className="space-y-4">
                                      {(() => {
                                        const resource = resources.find(r => r.resourceItemId === req.resourceItemId);
                                        const availableQty = resource?.quantity ?? 0;
                                        const unit = resource?.unit ?? req.unit;
                                        const isSufficient = availableQty >= req.quantity;
                                        return (
                                          <div className="p-4 border rounded space-y-2 text-sm">
                                            <p className="font-semibold">Current Availability</p>
                                            <div className="flex items-center justify-between">
                                              <p className="text-gray-600">{resource?.name ?? req.itemName}</p>
                                              <Badge className={isSufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {availableQty} {unit} available
                                              </Badge>
                                            </div>
                                            {!isSufficient && (
                                              <p className="text-red-700">
                                                Insufficient stock to approve this request (requested {req.quantity} {unit}).
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div className="p-4 bg-gray-50 rounded space-y-2 text-sm">
                                        <p><span className="text-gray-600">Requested by:</span> {req.requestedBy}</p>
                                        <p><span className="text-gray-600">Item:</span> {req.itemName}</p>
                                        <p><span className="text-gray-600">Quantity:</span> {req.quantity} {req.unit}</p>
                                        <p><span className="text-gray-600">Destination:</span> {req.destination}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Rejection reason (if rejecting)</Label>
                                        <Textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="Required for rejection..." rows={3} />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleApproveRequest(req.resourceRequestId)}
                                          disabled={(resources.find(r => r.resourceItemId === req.resourceItemId)?.quantity ?? 0) < req.quantity}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />Approve
                                        </Button>
                                        <Button variant="destructive" onClick={() => handleRejectRequest(req.resourceRequestId)} disabled={!rejectionNote.trim()}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {req.status === 'Approved' && (
                                <div className="flex gap-2 items-center">
                                  {req.assignedDriverId ? (
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-green-100 text-green-800 border border-green-200">
                                        Assigned: {req.driverName || req.assignedDriverId}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Select onValueChange={(v) => handleAssignDriver(req.resourceRequestId, v)}>
                                      <SelectTrigger className="w-44"><SelectValue placeholder="Assign driver" /></SelectTrigger>
                                      <SelectContent>
                                        {drivers.length === 0 ? (
                                          <SelectItem value="__none__" disabled>No available drivers</SelectItem>
                                        ) : (
                                          drivers.map((d) => <SelectItem key={d.driverId} value={d.driverId}>{d.name}</SelectItem>)
                                        )}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button size="sm" onClick={() => handleMarkDelivered(req.resourceRequestId)}>Mark Delivered</Button>
                                </div>
                              )}
                              {req.status === 'Delivered' && <div className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="h-4 w-4" /> Delivered</div>}
                              {req.status === 'Rejected' && req.rejectionReason && <p className="text-sm text-red-600">{req.rejectionReason}</p>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!isAdmin && !isResourceManager && (
            <Card>
              <CardHeader><CardTitle>My Resource Requests</CardTitle><CardDescription>Track your submitted requests</CardDescription></CardHeader>
              <CardContent>
                <ResourceRequestsTable requests={requests.filter((r) => r.requestedBy === user?.userId)} getStatusColor={getStatusColor} getUrgencyColor={getUrgencyColor} />
              </CardContent>
            </Card>
          )}

          {showReport && (
            <ResourceUsageReportModal
              open={showReport}
              onOpenChange={setShowReport}
              data={reportData}
            />
          )}
        </>
      )
      }
    </div >
  );
};

function ResourceRequestForm({
  resources,
  onSuccess,
  fixedDestination,
}: {
  resources: Resource[];
  onSuccess: () => void;
  fixedDestination: string | null;
}) {
  const [resourceItemId, setResourceItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [destination, setDestination] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (fixedDestination) setDestination(fixedDestination);
  }, [fixedDestination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceItemId || quantity < 1) { toast.error('Please select a resource and enter quantity'); return; }
    setSubmitting(true);
    try {
      const effectiveDestination = fixedDestination ?? destination;
      await resourceApi.createResourceRequest({
        resourceItemId,
        quantity,
        destination: effectiveDestination || undefined,
        urgency: urgency || undefined
      });
      toast.success('Request submitted');
      setResourceItemId(''); setQuantity(1); setDestination(fixedDestination ?? ''); setUrgency('Medium');
      onSuccess();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2"><Label>Resource Item</Label>
        <Select value={resourceItemId} onValueChange={setResourceItemId} required>
          <SelectTrigger><SelectValue placeholder="Select resource..." /></SelectTrigger>
          <SelectContent>
            {resources.map((r) => (
              <SelectItem key={r.resourceItemId} value={r.resourceItemId}>{r.name} ({r.warehouseName}) - {r.quantity} {r.unit}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} /></div>
      <div className="space-y-2">
        <Label>Destination</Label>
        {fixedDestination ? (
          <Input value={fixedDestination} readOnly aria-readonly="true" />
        ) : (
          <PlacesAddressAutocomplete
            value={destination}
            onChange={setDestination}
            onPlaceResolved={(p) => {
              if (!p) return;
              const name = (p.name || '').trim();
              const address = (p.address || '').trim();
              setDestination(name ? `${name} • ${address}` : address);
            }}
            placeholder="Search delivery destination (Malaysia)"
          />
        )}
      </div>
      <div className="space-y-2"><Label>Urgency</Label>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2 lg:col-span-4"><Button type="submit" disabled={submitting}>Submit Request</Button></div>
    </form>
  );
}

function ResourceRequestsTable({ requests, getStatusColor, getUrgencyColor }: { requests: ResourceRequest[]; getStatusColor: (s: string) => string; getUrgencyColor: (s: string) => string }) {
  if (requests.length === 0) return <p className="text-gray-500">No requests</p>;
  const sorted = sortByIdDesc(requests, (r) => r.resourceRequestId);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Urgency</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((req) => (
          <TableRow key={req.resourceRequestId}>
            <TableCell className="font-mono text-sm">{req.resourceRequestId}</TableCell>
            <TableCell><div><p className="font-semibold">{req.itemName}</p><p className="text-xs text-gray-600">{req.type}</p></div></TableCell>
            <TableCell>{req.quantity} {req.unit}</TableCell>
            <TableCell>{req.destination}</TableCell>
            <TableCell><Badge className={getUrgencyColor(req.urgency)}>{req.urgency}</Badge></TableCell>
            <TableCell>
              <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
              {req.rejectionReason && <p className="text-xs text-red-600 mt-1">{req.rejectionReason}</p>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ResourceManagerCRUD({ resources, warehouses, onSuccess, onGenerateReport }: { resources: Resource[]; warehouses: Warehouse[]; onSuccess: () => void; onGenerateReport: () => void }) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [stockInResource, setStockInResource] = useState<Resource | null>(null);
  const [createData, setCreateData] = useState({ name: '', type: '', unit: 'units', quantity: 0, status: 'Available' });
  const [editData, setEditData] = useState({ name: '', type: '', unit: 'units', quantity: 0, status: '' });
  const [stockInData, setStockInData] = useState({ quantityAdded: 0, source: '' });

  const myWh = warehouses.find((w) => w.managedBy === user?.userId);
  const whId = myWh?.warehouseId ?? '';

  const handleCreate = async () => {
    if (!whId) { toast.error('You are not assigned to a warehouse'); return; }
    try {
      await resourceApi.createResource({ ...createData, warehouseId: whId });
      toast.success('Resource created');
      setShowCreate(false);
      setCreateData({ name: '', type: '', unit: 'units', quantity: 0, status: 'Available' });
      onSuccess();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await resourceApi.updateResource(editing.resourceItemId, editData);
      toast.success('Resource updated');
      setEditing(null);
      onSuccess();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleDelete = async (resourceItemId: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await resourceApi.deleteResource(resourceItemId);
      toast.success('Resource deleted');
      onSuccess();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleStockIn = async () => {
    if (!stockInResource || stockInData.quantityAdded <= 0 || !stockInData.source.trim()) { toast.error('Enter quantity and source'); return; }
    try {
      await resourceApi.stockIn(stockInResource.resourceItemId, stockInData);
      toast.success('Stock added');
      setStockInResource(null);
      setStockInData({ quantityAdded: 0, source: '' });
      onSuccess();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resource Inventory - {myWh?.name ?? 'Your Warehouse'}</CardTitle>
            <CardDescription>Create, update, delete resources and add stock</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onGenerateReport} className="gap-2">
              <Printer className="h-4 w-4" />
              Generate Report
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Resource</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Resource</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                  <div><Label>Name</Label><Input value={createData.name} onChange={(e) => setCreateData((d) => ({ ...d, name: e.target.value }))} /></div>
                  <div><Label>Type</Label><Input value={createData.type} onChange={(e) => setCreateData((d) => ({ ...d, type: e.target.value }))} /></div>
                  <div><Label>Unit</Label><Input value={createData.unit} onChange={(e) => setCreateData((d) => ({ ...d, unit: e.target.value }))} /></div>
                  <div><Label>Quantity</Label><Input type="number" value={createData.quantity} onChange={(e) => setCreateData((d) => ({ ...d, quantity: parseInt(e.target.value) || 0 }))} /></div>
                  <Button onClick={handleCreate} disabled={!whId}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.map((r) => (
            <div key={r.resourceItemId} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-gray-600">{r.type}</p>
                <p className="text-lg font-bold mt-1">{r.quantity} {r.unit}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStockInResource(r); setStockInData({ quantityAdded: 0, source: '' }); }}>Stock In</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(r); setEditData({ name: r.name, type: r.type, unit: r.unit, quantity: r.quantity, status: r.status }); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(r.resourceItemId)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        {stockInResource && (
          <Dialog open={!!stockInResource} onOpenChange={() => setStockInResource(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Stock In - {stockInResource.name}</DialogTitle><DialogDescription>Add quantity and specify source (e.g. donation, purchase)</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>Quantity to Add</Label><Input type="number" min={1} value={stockInData.quantityAdded} onChange={(e) => setStockInData((d) => ({ ...d, quantityAdded: parseInt(e.target.value) || 0 }))} /></div>
                <div><Label>Source</Label><Input placeholder="e.g. Donation, Purchase, Transfer" value={stockInData.source} onChange={(e) => setStockInData((d) => ({ ...d, source: e.target.value }))} /></div>
                <Button onClick={handleStockIn}>Add Stock</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editing && (
          <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Resource</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} /></div>
                <div><Label>Type</Label><Input value={editData.type} onChange={(e) => setEditData((d) => ({ ...d, type: e.target.value }))} /></div>
                <div><Label>Unit</Label><Input value={editData.unit} onChange={(e) => setEditData((d) => ({ ...d, unit: e.target.value }))} /></div>
                <div><Label>Quantity</Label><Input type="number" value={editData.quantity} onChange={(e) => setEditData((d) => ({ ...d, quantity: parseInt(e.target.value) || 0 }))} /></div>
                <Button onClick={handleUpdate}>Update</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function ResourceUsageReportModal({ open, onOpenChange, data }: { open: boolean; onOpenChange: (o: boolean) => void; data: ResourceUsageReport[] }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Resource Usage Report</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 5px; }
              p { text-align: center; color: #666; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
            </style>
          </head>
          <body>
            <h1>Resource Usage Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th class="text-right">Current Qty</th>
                  <th>Unit</th>
                  <th class="text-center">Requests Processed</th>
                  <th class="text-center">Delivered Qty (Est)</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    <td>${item.warehouseName}</td>
                    <td>${item.itemName}</td>
                    <td>${item.type}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td class="text-center">${item.requestsCount}</td>
                    <td class="text-center">${item.deliveredCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Warehouse,Item Name,Type,Current Qty,Unit,Requests Processed,Delivered Count,Generated At'];
    const rows = data.map(item => [
      `"${item.warehouseName}"`,
      `"${item.itemName}"`,
      `"${item.type}"`,
      item.quantity,
      `"${item.unit}"`,
      item.requestsCount,
      item.deliveredCount,
      `"${new Date(item.generatedAt).toLocaleString()}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resource_usage_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-7xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Resource Usage Report</DialogTitle>
          <DialogDescription>Overview of resource inventory and usage across all warehouses.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 px-6 py-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Package className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-6 pt-2 scrollbar-dialog">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-center">Requests</TableHead>
                  <TableHead className="text-center">Delivered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.reportId}>
                    <TableCell className="font-medium">{item.warehouseName}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-center">{item.requestsCount}</TableCell>
                    <TableCell className="text-center">{item.deliveredCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
