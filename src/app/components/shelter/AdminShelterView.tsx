import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Home as HomeIcon, Users, MapPin, Plus, Printer, Loader2, Pencil, Trash2, FileCheck, Check, X } from 'lucide-react';
import { Shelter, ShelterStatus } from '../../lib/types';
import type { ShelterRegistrationRequestApi } from '../../lib/types';
import { shelterApi } from '../../lib/api';
import { authApi } from '../../lib/api';
import { toast } from 'sonner';

interface UserOption {
  userId: string;
  name: string;
  role: string;
}

export const AdminShelterView = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editShelter, setEditShelter] = useState<Shelter | null>(null);
  const [deleteShelter, setDeleteShelter] = useState<Shelter | null>(null);
  const [form, setForm] = useState({
    shelterName: '', address: '', totalCapacity: 100, status: 'Open' as string, managedBy: '' as string | null
  });
  const [registrationRequests, setRegistrationRequests] = useState<ShelterRegistrationRequestApi[]>([]);
  const [rejectDialog, setRejectDialog] = useState<{ requestId: string; request: ShelterRegistrationRequestApi } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const shelterManagers = users.filter(u => u.role === 'Shelter Manager');

  const loadShelters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shelterApi.getAll();
      setShelters(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shelters');
      setShelters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const list = await authApi.getAllUsers();
      setUsers(list.map(u => ({ userId: u.userId, name: u.name, role: u.role })));
    } catch {
      setUsers([]);
    }
  }, []);

  const loadRegistrationRequests = useCallback(async () => {
    try {
      const list = await shelterApi.getRegistrationRequests(false);
      setRegistrationRequests(list);
    } catch {
      setRegistrationRequests([]);
    }
  }, []);

  useEffect(() => {
    loadShelters();
    loadUsers();
    loadRegistrationRequests();
  }, [loadShelters, loadUsers, loadRegistrationRequests]);

  const loadShelterDetails = useCallback(async (shelterId: string) => {
    setDetailsLoading(true);
    try {
      const { shelter: full } = await shelterApi.getWithDetails(shelterId);
      setShelters(prev => prev.map(s => s.id === shelterId ? { ...full, id: s.id } : s));
      setSelectedShelter(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shelter details');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleCreateShelter = async () => {
    if (!form.shelterName.trim() || !form.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    try {
      await shelterApi.create({
        shelterName: form.shelterName,
        address: form.address,
        totalCapacity: form.totalCapacity,
        status: form.status,
        managedBy: form.managedBy || null
      });
      toast.success('Shelter created');
      setCreateOpen(false);
      setForm({ shelterName: '', address: '', totalCapacity: 100, status: 'Open', managedBy: null });
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create shelter');
    }
  };

  const handleUpdateShelter = async () => {
    if (!editShelter || !form.shelterName.trim() || !form.address.trim()) return;
    try {
      await shelterApi.update(editShelter.id, {
        shelterId: editShelter.id,
        shelterName: form.shelterName,
        address: form.address,
        totalCapacity: form.totalCapacity,
        availableCapacity: editShelter.TotalCapacity - editShelter.currentOccupancy,
        status: form.status as ShelterStatus,
        managedBy: form.managedBy || null,
        registeredAt: editShelter.createdAt,
        lastModifiedAt: new Date().toISOString()
      });
      toast.success('Shelter updated');
      setEditShelter(null);
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update shelter');
    }
  };

  const handleDeleteShelter = async () => {
    if (!deleteShelter) return;
    try {
      await shelterApi.delete(deleteShelter.id);
      toast.success('Shelter deleted');
      setDeleteShelter(null);
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete shelter');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await shelterApi.approveRegistrationRequest(requestId);
      toast.success('Request approved. Shelter created.');
      await loadRegistrationRequests();
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectDialog) return;
    try {
      await shelterApi.rejectRegistrationRequest(rejectDialog.requestId, rejectReason || undefined);
      toast.success('Request rejected');
      setRejectDialog(null);
      setRejectReason('');
      await loadRegistrationRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject');
    }
  };

  const openEdit = (shelter: Shelter) => {
    setEditShelter(shelter);
    setForm({
      shelterName: shelter.name,
      address: shelter.location,
      totalCapacity: shelter.TotalCapacity,
      status: shelter.status,
      managedBy: shelter.manager || null
    });
  };

  const handleGenerateReport = async (shelterId: string, shelterName: string) => {
    try {
      await shelterApi.generateReport(shelterId);
      toast.success(`Report generated for ${shelterName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate report');
    }
  };

  const getShelterStatusColor = (status: ShelterStatus) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyPercentage = (shelter: Shelter) =>
    shelter.TotalCapacity <= 0 ? 0 : Math.round((shelter.currentOccupancy / shelter.TotalCapacity) * 100);

  const displayShelter = (shelter: Shelter) => selectedShelter?.id === shelter.id ? selectedShelter : shelter;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Shelter Management</h2>
          <p className="text-gray-600">View and manage all shelters, assign managers, approve registrations</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add shelter
          </Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Create shelter</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.shelterName} onChange={(e) => setForm({ ...form, shelterName: e.target.value })} placeholder="Shelter name" /></div>
              <div className="grid gap-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" /></div>
              <div className="grid gap-2"><Label>Total capacity</Label><Input type="number" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: parseInt(e.target.value, 10) || 0 })} /></div>
              <div className="grid gap-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Full">Full</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Assign manager</Label>
                <Select value={form.managedBy ?? 'none'} onValueChange={(v) => setForm({ ...form, managedBy: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {shelterManagers
                      .filter(m => !shelters.some(s => s.manager === m.userId))
                      .map(m => (<SelectItem key={m.userId} value={m.userId}>{m.name} ({m.userId})</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateShelter}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Shelter registration requests</CardTitle>
          <CardDescription>
            Manage shelter registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="history">Request History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Shelter name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationRequests.filter(r => r.status === 'Pending').map((req) => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-mono text-sm">{req.requestId}</TableCell>
                      <TableCell>{req.shelterName}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{req.address}</TableCell>
                      <TableCell>{req.totalCapacity}</TableCell>
                      <TableCell>{req.requestedBy}</TableCell>
                      <TableCell className="text-sm">{new Date(req.requestedAt).toLocaleDateString('en-MY')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApproveRequest(req.requestId)} title="Approve"><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setRejectDialog({ requestId: req.requestId, request: req })} title="Reject"><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registrationRequests.filter(r => r.status === 'Pending').length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No pending requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Shelter name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationRequests.filter(r => r.status !== 'Pending').map((req) => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-mono text-sm">{req.requestId}</TableCell>
                      <TableCell>{req.shelterName}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{req.address}</TableCell>
                      <TableCell>{req.totalCapacity}</TableCell>
                      <TableCell>{req.requestedBy}</TableCell>
                      <TableCell className="text-sm">{new Date(req.requestedAt).toLocaleDateString('en-MY')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={req.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registrationRequests.filter(r => r.status !== 'Pending').length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No historical requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject registration request</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {rejectDialog && <p className="text-sm text-muted-foreground">Reject {rejectDialog.request.shelterName}?</p>}
            <div className="grid gap-2"><Label>Reason (optional)</Label><Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection" /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectRequest}>Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total Shelters</p><p className="text-3xl font-bold mt-1">{shelters.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Open Shelters</p><p className="text-3xl font-bold mt-1 text-green-600">{shelters.filter(s => s.status === 'Open').length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total Evacuees</p><p className="text-3xl font-bold mt-1">{shelters.reduce((sum, s) => sum + s.currentOccupancy, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Available Capacity</p><p className="text-3xl font-bold mt-1">{shelters.reduce((sum, s) => sum + (s.TotalCapacity - s.currentOccupancy), 0)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shelters.map((shelter) => {
          const current = displayShelter(shelter);
          return (
            <Card key={shelter.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><HomeIcon className="h-5 w-5" />{current.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{current.location}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getShelterStatusColor(current.status)}>{current.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(shelter)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteShelter(shelter)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Managed by</p><p className="font-semibold">{current.manager || '-'}</p></div>
                  <div>
                    <p className="text-sm text-gray-600">Occupancy</p>
                    <p className="font-semibold">{current.currentOccupancy} / {current.TotalCapacity}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${getOccupancyPercentage(current) >= 90 ? 'bg-red-600' : getOccupancyPercentage(current) >= 70 ? 'bg-orange-600' : 'bg-green-600'}`} style={{ width: `${getOccupancyPercentage(current)}%` }} />
                    </div>
                  </div>
                </div>
                <div><p className="text-sm text-gray-600 mb-2">Resources</p>{current.resources.length === 0 ? <span className="text-sm text-gray-500">None</span> : <div className="flex flex-wrap gap-2">{current.resources.map((r, i) => <Badge key={i} variant="outline">{r}</Badge>)}</div>}</div>
                <div className="flex gap-2 flex-wrap">
                  <Dialog onOpenChange={(open) => open && loadShelterDetails(shelter.id)}>
                    <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" />View Evacuees ({current.evacuees.length > 0 ? current.evacuees.length : current.currentOccupancy})</Button></DialogTrigger>
                    <DialogContent className="w-[90vw] max-w-none sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Evacuees at {current.name}</DialogTitle></DialogHeader>
                      {detailsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                        <div className="space-y-4">
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>ID Number</TableHead>
                                  <TableHead>Age</TableHead>
                                  <TableHead>Gender</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Medical</TableHead>
                                  <TableHead>Check-in</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(selectedShelter?.id === shelter.id ? selectedShelter : current).evacuees.map((ev) => (
                                  <TableRow key={ev.id}>
                                    <TableCell className="font-medium">{ev.name}</TableCell>
                                    <TableCell>{ev.idNumber || '-'}</TableCell>
                                    <TableCell>{ev.age}</TableCell>
                                    <TableCell>{ev.gender}</TableCell>
                                    <TableCell>{ev.phone}</TableCell>
                                    <TableCell>{ev.medicalNeeds || '-'}</TableCell>
                                    <TableCell className="text-sm">{new Date(ev.checkinDate).toLocaleString('en-MY')}</TableCell>
                                  </TableRow>
                                ))}
                                {current.evacuees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">No evacuees</TableCell></TableRow>}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleGenerateReport(shelter.id, shelter.name)}><Printer className="h-4 w-4" />Print report</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteShelter} onOpenChange={(o) => { if (!o) { setDeleteShelter(null); setDeleteConfirmation(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shelter?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteShelter?.name}. This cannot be undone. Ensure no active evacuees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteShelter && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>To confirm, type <span className="font-mono font-bold select-all">{deleteShelter.id}</span> below:</Label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={deleteShelter.id}
                  className="font-mono"
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteShelter}
              disabled={deleteConfirmation !== deleteShelter?.id}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editShelter && (
        <Dialog open={!!editShelter} onOpenChange={(o) => !o && setEditShelter(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit shelter</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.shelterName} onChange={(e) => setForm({ ...form, shelterName: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Total capacity</Label><Input type="number" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: parseInt(e.target.value, 10) || 0 })} /></div>
              <div className="grid gap-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Full">Full</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Assign manager</Label>
                <Select value={form.managedBy ?? 'none'} onValueChange={(v) => setForm({ ...form, managedBy: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {shelterManagers
                      .filter(m => !shelters.some(s => s.manager === m.userId && s.id !== editShelter.id))
                      .map(m => (<SelectItem key={m.userId} value={m.userId}>{m.name} ({m.userId})</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleUpdateShelter}>Save changes</Button>
          </DialogContent>
        </Dialog>
      )}

      {shelters.length === 0 && (
        <Card><CardContent className="py-12 text-center text-gray-500">No shelters. Add one using the button above.</CardContent></Card>
      )}
    </div>
  );
};
