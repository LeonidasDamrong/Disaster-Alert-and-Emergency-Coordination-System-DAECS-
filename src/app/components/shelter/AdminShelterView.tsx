import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { Home as HomeIcon, Users, MapPin, Plus, Printer, Loader2, LogOut, Pencil, Trash2, FileCheck } from 'lucide-react';
import { Shelter, ShelterStatus } from '../../lib/types';
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
  const [newEvacuee, setNewEvacuee] = useState({
    name: '', age: '', gender: 'Male', phone: '', medicalNeeds: '', idNumber: ''
  });
  const [form, setForm] = useState({
    shelterName: '', address: '', totalCapacity: 100, status: 'Open' as string, managedBy: '' as string | null
  });

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

  useEffect(() => {
    loadShelters();
    loadUsers();
  }, [loadShelters, loadUsers]);

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

  const handleRegisterEvacuee = async (shelterId: string) => {
    const age = parseInt(newEvacuee.age, 10);
    if (!newEvacuee.name || !newEvacuee.phone || isNaN(age)) {
      toast.error('Please fill name, age and phone');
      return;
    }
    try {
      await shelterApi.registerEvacuee(shelterId, {
        evacueeName: newEvacuee.name,
        evacueeAge: age,
        evacueeGender: newEvacuee.gender,
        evacueePhone: newEvacuee.phone,
        evacueeIdNumber: newEvacuee.idNumber || undefined,
        evacueeMedicalNeeds: newEvacuee.medicalNeeds || undefined
      });
      setNewEvacuee({ name: '', age: '', gender: 'Male', phone: '', medicalNeeds: '', idNumber: '' });
      toast.success('Evacuee registered successfully');
      await loadShelterDetails(shelterId);
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register evacuee');
    }
  };

  const handleCheckoutEvacuee = async (shelterId: string, evacueeId: string) => {
    try {
      await shelterApi.checkoutEvacuee(shelterId, evacueeId);
      toast.success('Evacuee checked out');
      await loadShelterDetails(shelterId);
      await loadShelters();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to check out evacuee');
    }
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
                    {shelterManagers.map(m => (<SelectItem key={m.userId} value={m.userId}>{m.name} ({m.userId})</SelectItem>))}
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
          <CardDescription>Approve shelter registration requests from shelter managers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        </CardContent>
      </Card>

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
                    <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" />View Evacuees ({current.evacuees.length})</Button></DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Evacuees at {current.name}</DialogTitle></DialogHeader>
                      {detailsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader><CardTitle>Register new evacuee</CardTitle></CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Name *</Label><Input value={newEvacuee.name} onChange={(e) => setNewEvacuee({ ...newEvacuee, name: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Age *</Label><Input type="number" value={newEvacuee.age} onChange={(e) => setNewEvacuee({ ...newEvacuee, age: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Gender *</Label><Input value={newEvacuee.gender} onChange={(e) => setNewEvacuee({ ...newEvacuee, gender: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Phone *</Label><Input value={newEvacuee.phone} onChange={(e) => setNewEvacuee({ ...newEvacuee, phone: e.target.value })} /></div>
                                <div className="col-span-2 space-y-2"><Label>Medical (optional)</Label><Input value={newEvacuee.medicalNeeds} onChange={(e) => setNewEvacuee({ ...newEvacuee, medicalNeeds: e.target.value })} /></div>
                              </div>
                              <Button className="mt-4 w-full gap-2" onClick={() => handleRegisterEvacuee(shelter.id)} disabled={!newEvacuee.name || !newEvacuee.age || !newEvacuee.phone || current.status === 'Full'}><Plus className="h-4 w-4" />Register evacuee</Button>
                            </CardContent>
                          </Card>
                          <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Phone</TableHead><TableHead>Check-in</TableHead><TableHead className="w-[80px]">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {(selectedShelter?.id === shelter.id ? selectedShelter : current).evacuees.map((ev) => (
                                <TableRow key={ev.id}>
                                  <TableCell className="font-medium">{ev.name}</TableCell><TableCell>{ev.age}</TableCell><TableCell>{ev.gender}</TableCell><TableCell>{ev.phone}</TableCell>
                                  <TableCell className="text-sm">{new Date(ev.checkinDate).toLocaleString('en-MY')}</TableCell>
                                  <TableCell><Button variant="ghost" size="sm" className="text-amber-600" onClick={() => handleCheckoutEvacuee(shelter.id, ev.id)} title="Check out"><LogOut className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))}
                              {current.evacuees.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No evacuees</TableCell></TableRow>}
                            </TableBody>
                          </Table>
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

      <AlertDialog open={!!deleteShelter} onOpenChange={(o) => !o && setDeleteShelter(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shelter?</AlertDialogTitle>
            <AlertDialogDescription>Delete {deleteShelter?.name}. This cannot be undone. Ensure no active evacuees.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShelter} className="bg-red-600">Delete</AlertDialogAction>
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
                    {shelterManagers.map(m => (<SelectItem key={m.userId} value={m.userId}>{m.name} ({m.userId})</SelectItem>))}
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
