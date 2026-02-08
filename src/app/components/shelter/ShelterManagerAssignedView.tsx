import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Home as HomeIcon, Users, MapPin, Plus, Printer, Loader2, LogOut, Package, FileCheck } from 'lucide-react';
import { Shelter, ShelterStatus, Evacuee } from '../../lib/types';
import { shelterApi } from '../../lib/api';
import { toast } from 'sonner';

interface ShelterManagerAssignedViewProps {
  shelter: Shelter;
  onRefresh: () => void;
}

export const ShelterManagerAssignedView = ({ shelter: initialShelter, onRefresh }: ShelterManagerAssignedViewProps) => {
  const [shelter, setShelter] = useState<Shelter>(initialShelter);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [evacueeDialogOpen, setEvacueeDialogOpen] = useState(false);
  const [newEvacuee, setNewEvacuee] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    medicalNeeds: '',
    idNumber: ''
  });

  const loadDetails = useCallback(async () => {
    setDetailsLoading(true);
    try {
      const { shelter: full } = await shelterApi.getWithDetails(shelter.id);
      setShelter(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shelter details');
    } finally {
      setDetailsLoading(false);
    }
  }, [shelter.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleRegisterEvacuee = async () => {
    const age = parseInt(newEvacuee.age, 10);
    if (!newEvacuee.name || !newEvacuee.phone || isNaN(age)) {
      toast.error('Please fill name, age and phone');
      return;
    }
    try {
      await shelterApi.registerEvacuee(shelter.id, {
        evacueeName: newEvacuee.name,
        evacueeAge: age,
        evacueeGender: newEvacuee.gender,
        evacueePhone: newEvacuee.phone,
        evacueeIdNumber: newEvacuee.idNumber || undefined,
        evacueeMedicalNeeds: newEvacuee.medicalNeeds || undefined
      });
      setNewEvacuee({ name: '', age: '', gender: 'Male', phone: '', medicalNeeds: '', idNumber: '' });
      toast.success('Evacuee registered successfully');
      await loadDetails();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register evacuee');
    }
  };

  const handleCheckoutEvacuee = async (evacueeId: string) => {
    try {
      await shelterApi.checkoutEvacuee(shelter.id, evacueeId);
      toast.success('Evacuee checked out');
      await loadDetails();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to check out evacuee');
    }
  };

  const handleGenerateReport = async () => {
    try {
      await shelterApi.generateReport(shelter.id);
      toast.success(`Report generated for ${shelter.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate report');
    }
  };

  const handleRequestResource = () => {
    toast.info('Resource request will be available when the Resource Management module is completed.');
  };

  const handleRequestShelterRegistration = () => {
    toast.info('Shelter registration request has been submitted for admin approval.');
  };

  const getStatusColor = (status: ShelterStatus) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
    }
  };

  const occupancyPct = shelter.TotalCapacity <= 0 ? 0 : Math.round((shelter.currentOccupancy / shelter.TotalCapacity) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Shelter</h2>
        <p className="text-gray-600">Manage your assigned shelter</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                {shelter.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {shelter.location}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(shelter.status)}>{shelter.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Occupancy</p>
              <p className="font-semibold">{shelter.currentOccupancy} / {shelter.TotalCapacity}</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    occupancyPct >= 90 ? 'bg-red-600' : occupancyPct >= 70 ? 'bg-orange-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Resources</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {shelter.resources.length === 0 ? (
                  <span className="text-sm text-gray-500">None recorded</span>
                ) : (
                  shelter.resources.map((r, i) => <Badge key={i} variant="outline">{r}</Badge>)
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={evacueeDialogOpen} onOpenChange={(o) => { setEvacueeDialogOpen(o); if (o) loadDetails(); }}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Users className="h-4 w-4" />
                  Register evacuee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register new evacuee</DialogTitle>
                </DialogHeader>
                {detailsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Name *</Label><Input value={newEvacuee.name} onChange={(e) => setNewEvacuee({ ...newEvacuee, name: e.target.value })} placeholder="Full name" /></div>
                      <div className="space-y-2"><Label>Age *</Label><Input type="number" value={newEvacuee.age} onChange={(e) => setNewEvacuee({ ...newEvacuee, age: e.target.value })} placeholder="Age" /></div>
                      <div className="space-y-2"><Label>Gender *</Label><Input value={newEvacuee.gender} onChange={(e) => setNewEvacuee({ ...newEvacuee, gender: e.target.value })} placeholder="Male/Female" /></div>
                      <div className="space-y-2"><Label>Phone *</Label><Input value={newEvacuee.phone} onChange={(e) => setNewEvacuee({ ...newEvacuee, phone: e.target.value })} placeholder="+60..." /></div>
                      <div className="space-y-2 col-span-2"><Label>Medical needs (optional)</Label><Input value={newEvacuee.medicalNeeds} onChange={(e) => setNewEvacuee({ ...newEvacuee, medicalNeeds: e.target.value })} placeholder="Medical conditions or medication" /></div>
                    </div>
                    <Button onClick={handleRegisterEvacuee} className="w-full gap-2" disabled={!newEvacuee.name || !newEvacuee.age || !newEvacuee.phone || shelter.status === 'Full'}>
                      <Plus className="h-4 w-4" /> Register evacuee
                    </Button>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead className="w-[80px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shelter.evacuees.map((ev) => (
                          <TableRow key={ev.id}>
                            <TableCell className="font-medium">{ev.name}</TableCell>
                            <TableCell>{ev.age}</TableCell>
                            <TableCell>{ev.gender}</TableCell>
                            <TableCell>{ev.phone}</TableCell>
                            <TableCell className="text-sm">{new Date(ev.checkinDate).toLocaleString('en-MY')}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => handleCheckoutEvacuee(ev.id)} title="Check out"><LogOut className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {shelter.evacuees.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-4">No evacuees registered yet</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2" onClick={handleRequestResource} title="Resource module not yet available">
              <Package className="h-4 w-4" />
              Request resource
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleRequestShelterRegistration}>
              <FileCheck className="h-4 w-4" />
              Request shelter registration
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleGenerateReport}>
              <Printer className="h-4 w-4" />
              Generate status report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
