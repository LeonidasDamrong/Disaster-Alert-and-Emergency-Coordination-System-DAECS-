import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Home as HomeIcon, Users, MapPin, Plus, Printer, Loader2, LogOut, Package, FileCheck } from 'lucide-react';
import { Shelter, ShelterStatus } from '../../lib/types';
import { shelterApi } from '../../lib/api';
import { toast } from 'sonner';

interface ShelterManagerAssignedViewProps {
  shelter: Shelter;
  onRefresh: () => void;
}

export const ShelterManagerAssignedView = ({ shelter: initialShelter, onRefresh }: ShelterManagerAssignedViewProps) => {
  const [shelter, setShelter] = useState<Shelter>(initialShelter);
  const [loading, setLoading] = useState(true);
  const [newEvacuee, setNewEvacuee] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    medicalNeeds: '',
    idNumber: ''
  });

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { shelter: full } = await shelterApi.getWithDetails(shelter.id);
      setShelter(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shelter details');
    } finally {
      setLoading(false);
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
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register evacuee');
    }
  };

  const handleCheckoutEvacuee = async (evacueeId: string) => {
    try {
      await shelterApi.checkoutEvacuee(shelter.id, evacueeId);
      toast.success('Evacuee checked out');
      await loadDetails();
      onRefresh();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Shelter</h2>
        <p className="text-gray-600">Manage your assigned shelter – all information displayed below</p>
      </div>

      {/* Shelter overview – full info visible */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total capacity</p>
              <p className="text-2xl font-semibold">{shelter.TotalCapacity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current occupancy</p>
              <p className="text-2xl font-semibold">{shelter.currentOccupancy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Available capacity</p>
              <p className="text-2xl font-semibold">{shelter.TotalCapacity - shelter.currentOccupancy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy</p>
              <p className="font-semibold">{shelter.currentOccupancy} / {shelter.TotalCapacity}</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    occupancyPct >= 90 ? 'bg-red-600' : occupancyPct >= 70 ? 'bg-orange-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{occupancyPct}% full</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Available resources</p>
            <div className="flex flex-wrap gap-2">
              {shelter.resources.length === 0 ? (
                <span className="text-sm text-gray-500">None recorded</span>
              ) : (
                shelter.resources.map((r, i) => <Badge key={i} variant="outline">{r}</Badge>)
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evacuees – full table visible, no dialog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Evacuees ({shelter.evacuees.length})
          </CardTitle>
          <CardDescription>All registered evacuees at this shelter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>ID number</TableHead>
                <TableHead>Medical needs</TableHead>
                <TableHead>Check-in date</TableHead>
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
                  <TableCell>{ev.idNumber || '-'}</TableCell>
                  <TableCell>{ev.medicalNeeds || '-'}</TableCell>
                  <TableCell className="text-sm">{new Date(ev.checkinDate).toLocaleString('en-MY')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-600"
                      onClick={() => handleCheckoutEvacuee(ev.id)}
                      title="Check out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {shelter.evacuees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No evacuees registered yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Register new evacuee – inline form, no dialog */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Register new evacuee</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newEvacuee.name} onChange={(e) => setNewEvacuee({ ...newEvacuee, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input type="number" value={newEvacuee.age} onChange={(e) => setNewEvacuee({ ...newEvacuee, age: e.target.value })} placeholder="Age" />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Input value={newEvacuee.gender} onChange={(e) => setNewEvacuee({ ...newEvacuee, gender: e.target.value })} placeholder="Male/Female" />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={newEvacuee.phone} onChange={(e) => setNewEvacuee({ ...newEvacuee, phone: e.target.value })} placeholder="+60..." />
              </div>
              <div className="space-y-2">
                <Label>ID number (optional)</Label>
                <Input value={newEvacuee.idNumber} onChange={(e) => setNewEvacuee({ ...newEvacuee, idNumber: e.target.value })} placeholder="NRIC / Passport" />
              </div>
              <div className="space-y-2">
                <Label>Medical needs (optional)</Label>
                <Input value={newEvacuee.medicalNeeds} onChange={(e) => setNewEvacuee({ ...newEvacuee, medicalNeeds: e.target.value })} placeholder="Medical conditions" />
              </div>
            </div>
            <Button
              className="mt-4 gap-2"
              onClick={handleRegisterEvacuee}
              disabled={!newEvacuee.name || !newEvacuee.age || !newEvacuee.phone || shelter.status === 'Full'}
            >
              <Plus className="h-4 w-4" /> Register evacuee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
};
