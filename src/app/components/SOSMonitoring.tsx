import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Radio, MapPin, Phone, User, Clock, FileText, Plus, CheckCircle } from 'lucide-react';
import { mockSOSRequests } from '../lib/mockData';
import { SOSStatus, UrgencyLevel, SOS, CaseNote } from '../lib/types';
import { toast } from 'sonner';

export const SOSMonitoring = () => {
  const [sosRequests, setSOSRequests] = useState<SOS[]>(mockSOSRequests);
  const [selectedSOS, setSelectedSOS] = useState<SOS | null>(null);
  const [newNote, setNewNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<SOSStatus | 'All'>('All');

  const filteredSOS = filterStatus === 'All' 
    ? sosRequests 
    : sosRequests.filter(sos => sos.status === filterStatus);

  const handleAcceptSOS = (sosId: string) => {
    setSOSRequests(prev =>
      prev.map(sos =>
        sos.id === sosId
          ? { ...sos, status: 'In Progress' as SOSStatus, assignedOfficer: 'Siti Nurhaliza', updatedAt: new Date().toISOString() }
          : sos
      )
    );
    toast.success('SOS request accepted and assigned');
  };

  const handleUpdateUrgency = (sosId: string, urgency: UrgencyLevel) => {
    setSOSRequests(prev =>
      prev.map(sos =>
        sos.id === sosId
          ? { ...sos, urgency, updatedAt: new Date().toISOString() }
          : sos
      )
    );
    toast.success(`Urgency level updated to ${urgency}`);
  };

  const handleUpdateStatus = (sosId: string, status: SOSStatus) => {
    setSOSRequests(prev =>
      prev.map(sos =>
        sos.id === sosId
          ? { ...sos, status, updatedAt: new Date().toISOString() }
          : sos
      )
    );
    toast.success(`Status updated to ${status}`);
  };

  const handleAddNote = (sosId: string) => {
    if (!newNote.trim()) return;

    const note: CaseNote = {
      id: `NOTE${Date.now()}`,
      author: 'Siti Nurhaliza',
      timestamp: new Date().toISOString(),
      note: newNote
    };

    setSOSRequests(prev =>
      prev.map(sos =>
        sos.id === sosId
          ? { ...sos, notes: [...sos.notes, note], updatedAt: new Date().toISOString() }
          : sos
      )
    );

    setNewNote('');
    toast.success('Case note added successfully');
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusColor = (status: SOSStatus) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'In Progress': return 'default';
      case 'Completed': return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SOS Monitoring</h2>
          <p className="text-gray-600">Emergency request management and tracking</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filter by Status:</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as SOSStatus | 'All')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">{filteredSOS.length} requests</Badge>
          </div>
        </CardContent>
      </Card>

      {/* SOS List */}
      <Card>
        <CardHeader>
          <CardTitle>SOS Requests</CardTitle>
          <CardDescription>Active and pending emergency requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Victim Info</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSOS.map((sos) => (
                <TableRow key={sos.id}>
                  <TableCell className="font-mono">{sos.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{sos.victimName}</p>
                      <p className="text-sm text-gray-600">{sos.victimPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{sos.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getUrgencyColor(sos.urgency)} border`}>
                      {sos.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(sos.status)}>
                      {sos.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sos.assignedOfficer || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSOS(sos)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>SOS Request Details - {sos.id}</DialogTitle>
                          <DialogDescription>
                            Created: {new Date(sos.createdAt).toLocaleString('en-MY')}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Victim Information */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Victim Name
                              </Label>
                              <p className="font-semibold">{sos.victimName}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Contact Number
                              </Label>
                              <p className="font-semibold">{sos.victimPhone}</p>
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                              </Label>
                              <p className="font-semibold">{sos.location}</p>
                              <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">
                                Map Placeholder: {sos.latitude}, {sos.longitude}
                              </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label>Description of Situation</Label>
                              <p className="p-3 bg-gray-50 rounded border">{sos.description}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Update Urgency Level</Label>
                              <Select 
                                value={sos.urgency}
                                onValueChange={(value) => handleUpdateUrgency(sos.id, value as UrgencyLevel)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Update Status</Label>
                              <Select 
                                value={sos.status}
                                onValueChange={(value) => handleUpdateStatus(sos.id, value as SOSStatus)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="New">New</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {sos.status === 'New' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full bg-red-600 hover:bg-red-700">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Accept SOS Request
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Accept SOS Request?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will assign the request to you and change the status to "In Progress".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAcceptSOS(sos.id)}>
                                    Accept Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Case Notes */}
                          <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Case Notes
                            </Label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                              {sos.notes.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                              ) : (
                                sos.notes.map((note) => (
                                  <div key={note.id} className="p-3 bg-gray-50 rounded border">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-semibold">{note.author}</span>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(note.timestamp).toLocaleString('en-MY')}
                                      </span>
                                    </div>
                                    <p className="text-sm">{note.note}</p>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Add a case note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={3}
                              />
                              <Button 
                                onClick={() => handleAddNote(sos.id)}
                                size="sm"
                                className="gap-2"
                                disabled={!newNote.trim()}
                              >
                                <Plus className="h-4 w-4" />
                                Add Note
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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