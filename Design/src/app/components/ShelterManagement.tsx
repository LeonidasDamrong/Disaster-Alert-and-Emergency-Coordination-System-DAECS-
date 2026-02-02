import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Home as HomeIcon, Users, MapPin, Plus, Printer } from 'lucide-react';
import { mockShelters } from '../lib/mockData';
import { Shelter, ShelterStatus, Evacuee } from '../lib/types';
import { toast } from 'sonner';

export const ShelterManagement: React.FC = () => {
  const [shelters, setShelters] = useState<Shelter[]>(mockShelters);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [newEvacuee, setNewEvacuee] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    medicalNeeds: ''
  });

  const handleRegisterEvacuee = (shelterId: string) => {
    const evacuee: Evacuee = {
      id: `EV${Date.now()}`,
      name: newEvacuee.name,
      age: parseInt(newEvacuee.age),
      gender: newEvacuee.gender,
      phone: newEvacuee.phone,
      checkinDate: new Date().toISOString(),
      medicalNeeds: newEvacuee.medicalNeeds || undefined
    };

    setShelters(prev =>
      prev.map(shelter =>
        shelter.id === shelterId
          ? {
              ...shelter,
              evacuees: [...shelter.evacuees, evacuee],
              currentOccupancy: shelter.currentOccupancy + 1,
              status: (shelter.currentOccupancy + 1 >= shelter.capacity ? 'Full' : shelter.status) as ShelterStatus
            }
          : shelter
      )
    );

    setNewEvacuee({ name: '', age: '', gender: 'Male', phone: '', medicalNeeds: '' });
    toast.success('Evacuee registered successfully');
  };

  const getShelterStatusColor = (status: ShelterStatus) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyPercentage = (shelter: Shelter) => {
    return Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
  };

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
            <p className="text-3xl font-bold mt-1">{shelters.reduce((sum, s) => sum + (s.capacity - s.currentOccupancy), 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shelters.map((shelter) => (
          <Card key={shelter.id}>
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
                <Badge className={getShelterStatusColor(shelter.status)}>
                  {shelter.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Manager</p>
                  <p className="font-semibold">{shelter.manager}</p>
                  <p className="text-sm text-gray-600">{shelter.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Occupancy</p>
                  <p className="font-semibold">{shelter.currentOccupancy} / {shelter.capacity}</p>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getOccupancyPercentage(shelter) >= 90 ? 'bg-red-600' :
                        getOccupancyPercentage(shelter) >= 70 ? 'bg-orange-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${getOccupancyPercentage(shelter)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{getOccupancyPercentage(shelter)}% full</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Available Resources</p>
                <div className="flex flex-wrap gap-2">
                  {shelter.resources.map((resource, idx) => (
                    <Badge key={idx} variant="outline">{resource}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedShelter(shelter)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Evacuees ({shelter.evacuees.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Evacuees at {shelter.name}</DialogTitle>
                      <DialogDescription>Registered evacuees and registration</DialogDescription>
                    </DialogHeader>

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
                                onChange={(e) => setNewEvacuee({...newEvacuee, name: e.target.value})}
                                placeholder="Full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Age *</Label>
                              <Input
                                type="number"
                                value={newEvacuee.age}
                                onChange={(e) => setNewEvacuee({...newEvacuee, age: e.target.value})}
                                placeholder="Age"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Gender *</Label>
                              <Input
                                value={newEvacuee.gender}
                                onChange={(e) => setNewEvacuee({...newEvacuee, gender: e.target.value})}
                                placeholder="Male/Female"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone *</Label>
                              <Input
                                value={newEvacuee.phone}
                                onChange={(e) => setNewEvacuee({...newEvacuee, phone: e.target.value})}
                                placeholder="+60..."
                              />
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label>Medical Needs (Optional)</Label>
                              <Input
                                value={newEvacuee.medicalNeeds}
                                onChange={(e) => setNewEvacuee({...newEvacuee, medicalNeeds: e.target.value})}
                                placeholder="Any medical conditions or medication requirements"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRegisterEvacuee(shelter.id)}
                            className="mt-4 w-full gap-2"
                            disabled={!newEvacuee.name || !newEvacuee.age || !newEvacuee.phone || shelter.status === 'Full'}
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shelter.evacuees.map((evacuee) => (
                            <TableRow key={evacuee.id}>
                              <TableCell className="font-semibold">{evacuee.name}</TableCell>
                              <TableCell>{evacuee.age}</TableCell>
                              <TableCell>{evacuee.gender}</TableCell>
                              <TableCell>{evacuee.phone}</TableCell>
                              <TableCell>{evacuee.medicalNeeds || '-'}</TableCell>
                              <TableCell className="text-sm">
                                {new Date(evacuee.checkinDate).toLocaleString('en-MY')}
                              </TableCell>
                            </TableRow>
                          ))}
                          {shelter.evacuees.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                No evacuees registered yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => toast.success('Shelter status report generated')}
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
