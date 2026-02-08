import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Home as HomeIcon, Users, MapPin, Plus, Printer, Loader2, LogOut } from 'lucide-react';
import { Shelter, ShelterStatus, Evacuee } from '../lib/types';
import { shelterApi } from '../lib/api';
import { toast } from 'sonner';

export const ShelterManagement = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newEvacuee, setNewEvacuee] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    medicalNeeds: '',
    idNumber: ''
  });

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

  useEffect(() => {
    loadShelters();
  }, [loadShelters]);

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

  const handleOpenEvacueeDialog = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    if (shelter.evacuees.length === 0 && shelter.resources.length === 0) {
      loadShelterDetails(shelter.id);
    } else {
      setSelectedShelter(shelter);
    }
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

  const getOccupancyPercentage = (shelter: Shelter) => {
    if (shelter.TotalCapacity <= 0) return 0;
    return Math.round((shelter.currentOccupancy / shelter.TotalCapacity) * 100);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Shelter Management</h2>
          <p className="text-gray-600">Monitor and manage evacuation shelters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Shelters</p>
            <p className="text-3xl font-bold mt-1">{shelters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Open Shelters</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{shelters.filter(s => s.status === 'Open').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Evacuees</p>
            <p className="text-3xl font-bold mt-1">{shelters.reduce((sum, s) => sum + s.currentOccupancy, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Available Capacity</p>
            <p className="text-3xl font-bold mt-1">{shelters.reduce((sum, s) => sum + (s.TotalCapacity - s.currentOccupancy), 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shelters.map((shelter) => {
          const current = displayShelter(shelter);
          return (
            <Card key={shelter.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HomeIcon className="h-5 w-5" />
                      {current.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {current.location}
                    </CardDescription>
                  </div>
                  <Badge className={getShelterStatusColor(current.status)}>
                    {current.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Managed by</p>
                    <p className="font-semibold">{current.manager || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupancy</p>
                    <p className="font-semibold">{current.currentOccupancy} / {current.TotalCapacity}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          getOccupancyPercentage(current) >= 90 ? 'bg-red-600' :
                          getOccupancyPercentage(current) >= 70 ? 'bg-orange-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${getOccupancyPercentage(current)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{getOccupancyPercentage(current)}% full</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Available Resources</p>
                  <div className="flex flex-wrap gap-2">
                    {current.resources.length === 0 ? (
                      <span className="text-sm text-gray-500">No resources recorded</span>
                    ) : (
                      current.resources.map((resource, idx) => (
                        <Badge key={idx} variant="outline">{resource}</Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog onOpenChange={(open) => open && loadShelterDetails(shelter.id)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenEvacueeDialog(shelter)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Evacuees ({current.evacuees.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Evacuees at {current.name}</DialogTitle>
                        <DialogDescription>Registered evacuees and registration</DialogDescription>
                      </DialogHeader>

                      {detailsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Register New Evacuee</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Name *</Label>
                                  <Input
                                    value={newEvacuee.name}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, name: e.target.value })}
                                    placeholder="Full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Age *</Label>
                                  <Input
                                    type="number"
                                    value={newEvacuee.age}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, age: e.target.value })}
                                    placeholder="Age"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Gender *</Label>
                                  <Input
                                    value={newEvacuee.gender}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, gender: e.target.value })}
                                    placeholder="Male/Female"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone *</Label>
                                  <Input
                                    value={newEvacuee.phone}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, phone: e.target.value })}
                                    placeholder="+60..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>ID Number (Optional)</Label>
                                  <Input
                                    value={newEvacuee.idNumber}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, idNumber: e.target.value })}
                                    placeholder="NRIC / Passport"
                                  />
                                </div>
                                <div className="col-span-2 space-y-2">
                                  <Label>Medical Needs (Optional)</Label>
                                  <Input
                                    value={newEvacuee.medicalNeeds}
                                    onChange={(e) => setNewEvacuee({ ...newEvacuee, medicalNeeds: e.target.value })}
                                    placeholder="Any medical conditions or medication requirements"
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={() => handleRegisterEvacuee(shelter.id)}
                                className="mt-4 w-full gap-2"
                                disabled={!newEvacuee.name || !newEvacuee.age || !newEvacuee.phone || current.status === 'Full'}
                              >
                                <Plus className="h-4 w-4" />
                                Register Evacuee
                              </Button>
                            </CardContent>
                          </Card>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Medical Needs</TableHead>
                                <TableHead>Check-in Date</TableHead>
                                <TableHead className="w-[80px]">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(selectedShelter?.id === shelter.id ? selectedShelter : current).evacuees.map((evacuee) => (
                                <TableRow key={evacuee.id}>
                                  <TableCell className="font-semibold">{evacuee.name}</TableCell>
                                  <TableCell>{evacuee.age}</TableCell>
                                  <TableCell>{evacuee.gender}</TableCell>
                                  <TableCell>{evacuee.phone}</TableCell>
                                  <TableCell>{evacuee.medicalNeeds || '-'}</TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(evacuee.checkinDate).toLocaleString('en-MY')}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-amber-600 hover:text-amber-700"
                                      onClick={() => handleCheckoutEvacuee(shelter.id, evacuee.id)}
                                      title="Check out"
                                    >
                                      <LogOut className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {current.evacuees.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                    No evacuees registered yet
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleGenerateReport(shelter.id, shelter.name)}
                  >
                    <Printer className="h-4 w-4" />
                    Print Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {shelters.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No shelters found. Shelters can be added by an administrator.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
