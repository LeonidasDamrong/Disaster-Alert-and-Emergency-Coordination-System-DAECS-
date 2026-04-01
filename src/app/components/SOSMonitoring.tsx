import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MapPin, Phone, User, Clock, FileText, Plus, CheckCircle, Locate } from 'lucide-react';
import { sosApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSOSSignalR, type SOSUpdatePayload } from '../hooks/useSOSSignalR';
import { SOSMapView, type DangerZoneData } from './SOSMapView';
import { SOSStatus, UrgencyLevel, SOS, CaseNote } from '../lib/types';
import { toast } from 'sonner';

function mapApiToSOS(r: {
  id: string;
  victimName: string;
  victimPhone: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  urgency: string;
  status: string;
  assignedResponder?: string;
  createdAt: string;
  updatedAt: string;
  solvedAt?: string;
  completionProofImageUrl?: string | null;
  completionProofUploadedAt?: string | null;
  completionProofUploadedBy?: string | null;
}): SOS {
  return {
    id: r.id,
    victimName: r.victimName ?? '',
    victimPhone: r.victimPhone ?? '',
    location: r.location ?? '',
    latitude: Number(r.latitude) || 0,
    longitude: Number(r.longitude) || 0,
    description: r.description ?? '',
    urgency: (r.urgency as UrgencyLevel) || 'Medium',
    status: (r.status as SOSStatus) || 'New',
    assignedResponder: r.assignedResponder,
    completionProofImageUrl: r.completionProofImageUrl ?? null,
    completionProofUploadedAt: r.completionProofUploadedAt ?? null,
    completionProofUploadedBy: r.completionProofUploadedBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    notes: [],
  };
}

export const SOSMonitoring = () => {
  const { user } = useAuth();
  const isViewOnly = user?.role === 'Admin' || user?.role === 'System Admin';

  const [sosRequests, setSOSRequests] = useState<SOS[]>([]);
  const [selectedSOS, setSelectedSOS] = useState<SOS | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<SOSStatus | 'All'>('All');
  const [dangerZones, setDangerZones] = useState<DangerZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locateSOSId, setLocateSOSId] = useState<string | null>(null);
  const mapSectionRef = React.useRef<HTMLDivElement>(null);

  const fetchSOS = useCallback(async () => {
    try {
      const status = filterStatus === 'All' ? undefined : filterStatus;
      const list = await sosApi.getAll(status);
      setSOSRequests(list.map(mapApiToSOS));
    } catch (err) {
      console.error('Failed to fetch SOS:', err);
      toast.error('Failed to load SOS requests');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchDangerZones = useCallback(async () => {
    try {
      const zones = await sosApi.getDangerZones();
      setDangerZones(zones);
    } catch {
      setDangerZones([]);
    }
  }, []);

  useEffect(() => {
    fetchSOS();
  }, [fetchSOS]);

  useEffect(() => {
    fetchDangerZones();
  }, [fetchDangerZones]);

  useSOSSignalR(
    (payload: SOSUpdatePayload) => {
      setSOSRequests(prev => {
        const existing = prev.find(s => s.id === payload.id);
        if (existing) return prev;
        return [mapApiToSOS(payload), ...prev];
      });
      toast.success(`New SOS: ${payload.id}`);
    },
    (payload: SOSUpdatePayload) => {
      setSOSRequests(prev =>
        prev.map(s => s.id === payload.id ? mapApiToSOS(payload) : s)
      );
      if (selectedSOS?.id === payload.id) {
        setSelectedSOS(mapApiToSOS(payload));
      }
    },
    !!user
  );

  const handleOpenDetails = useCallback(async (sos: SOS) => {
    setSelectedSOS(sos);
    setDialogOpen(true);
    try {
      const notes = await sosApi.getNotes(sos.id);
      setSelectedNotes(notes);
    } catch {
      setSelectedNotes([]);
    }
  }, []);

  const handleLocate = useCallback((sos: SOS) => {
    setSelectedSOS(sos);
    setLocateSOSId(sos.id);
    setDialogOpen(false);
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const filteredSOS = filterStatus === 'All'
    ? sosRequests
    : sosRequests.filter(sos => sos.status === filterStatus);

  const handleAcceptSOS = async (sosId: string) => {
    try {
      const updated = await sosApi.update(sosId, { accept: true });
      setSOSRequests(prev =>
        prev.map(s => (s.id === sosId ? mapApiToSOS(updated) : s))
      );
      if (selectedSOS?.id === sosId) {
        setSelectedSOS(mapApiToSOS(updated));
      }
      toast.success('SOS request accepted and assigned');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept');
    }
  };

  const handleUpdateUrgency = async (sosId: string, urgency: UrgencyLevel) => {
    try {
      const updated = await sosApi.update(sosId, { urgency });
      setSOSRequests(prev =>
        prev.map(s => (s.id === sosId ? mapApiToSOS(updated) : s))
      );
      if (selectedSOS?.id === sosId) {
        setSelectedSOS(mapApiToSOS(updated));
      }
      toast.success(`Urgency level updated to ${urgency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleUpdateStatus = async (sosId: string, status: SOSStatus) => {
    try {
      const updated = await sosApi.update(sosId, { status });
      setSOSRequests(prev =>
        prev.map(s => (s.id === sosId ? mapApiToSOS(updated) : s))
      );
      if (selectedSOS?.id === sosId) {
        setSelectedSOS(mapApiToSOS(updated));
      }
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleAddNote = async (sosId: string) => {
    if (!newNote.trim()) return;

    try {
      const note = await sosApi.addNote(sosId, newNote);
      setSelectedNotes(prev => [...prev, note]);
      setSOSRequests(prev =>
        prev.map(s =>
          s.id === sosId
            ? { ...s, notes: [...s.notes, note], updatedAt: note.timestamp }
            : s
        )
      );
      setNewNote('');
      toast.success('Case note added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleUploadProof = async (sosId: string) => {
    if (!proofFile) return;
    try {
      setProofUploading(true);
      const updated = await sosApi.uploadCompletionProof(sosId, proofFile);
      setSOSRequests(prev => prev.map(s => (s.id === sosId ? mapApiToSOS(updated) : s)));
      if (selectedSOS?.id === sosId) setSelectedSOS(mapApiToSOS(updated));
      setProofFile(null);
      toast.success('Completion proof uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload proof');
    } finally {
      setProofUploading(false);
    }
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

  const displayNotes = selectedSOS ? [...selectedSOS.notes, ...selectedNotes] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SOS Monitoring</h2>
          <p className="text-gray-600">Emergency request management and tracking</p>
        </div>
      </div>

      {/* Large Map View */}
      <div ref={mapSectionRef}>
        <Card>
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
          <CardDescription>SOS request locations and danger zones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <SOSMapView
              sosRequests={filteredSOS}
              dangerZones={dangerZones}
              selectedSOSId={selectedSOS?.id}
              centerOnSOSId={locateSOSId}
              onMarkerClick={(s) => setSelectedSOS(s)}
            />
          </div>
        </CardContent>
      </Card>
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
          {loading ? (
            <p className="text-gray-500 py-8 text-center">Loading...</p>
          ) : (
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
                      {sos.assignedResponder || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(sos)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SOS Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {selectedSOS && (
            <>
              <div className="shrink-0 px-6 pt-6 pb-2">
                <DialogHeader>
                  <DialogTitle>SOS Request Details - {selectedSOS.id}</DialogTitle>
                  <DialogDescription>
                    Created: {new Date(selectedSOS.createdAt).toLocaleString('en-MY')}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-b-lg pr-1 scrollbar-dialog">
                <div className="px-6 pb-6 pt-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Victim Name
                    </Label>
                    <p className="font-semibold">{selectedSOS.victimName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Number
                    </Label>
                    <p className="font-semibold">{selectedSOS.victimPhone}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{selectedSOS.location}</p>
                      {selectedSOS.latitude && selectedSOS.longitude && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleLocate(selectedSOS)}
                        >
                          <Locate className="h-4 w-4" />
                          Locate on Map
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {!isViewOnly && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Update Urgency Level</Label>
                        <Select
                          value={selectedSOS.urgency}
                          onValueChange={(value) => handleUpdateUrgency(selectedSOS.id, value as UrgencyLevel)}
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
                          value={selectedSOS.status}
                          onValueChange={(value) => handleUpdateStatus(selectedSOS.id, value as SOSStatus)}
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

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        Proof of Completion (Image)
                      </Label>

                      {selectedSOS.completionProofImageUrl ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            Uploaded {selectedSOS.completionProofUploadedAt ? new Date(selectedSOS.completionProofUploadedAt).toLocaleString('en-MY') : ''}{' '}
                            {selectedSOS.completionProofUploadedBy ? `by ${selectedSOS.completionProofUploadedBy}` : ''}
                          </div>
                          <a
                            href={selectedSOS.completionProofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline"
                          >
                            Open full image
                          </a>
                          <img
                            src={selectedSOS.completionProofImageUrl}
                            alt="Completion proof"
                            className="w-full max-h-64 object-contain border rounded bg-white"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadProof(selectedSOS.id)}
                            disabled={!proofFile || proofUploading}
                          >
                            {proofUploading ? 'Uploading...' : 'Upload Proof Image'}
                          </Button>
                          <p className="text-xs text-gray-500">
                            Upload a JPG/PNG/WEBP (max 5MB) as proof the request was solved.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleUpdateStatus(selectedSOS.id, 'Completed')}
                      disabled={!selectedSOS.completionProofImageUrl || selectedSOS.status === 'Completed'}
                    >
                      Complete Request
                    </Button>

                    {selectedSOS.status === 'New' && (
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
                            <AlertDialogAction onClick={() => handleAcceptSOS(selectedSOS.id)}>
                              Accept Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Case Notes
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 scrollbar-dialog">
                        {displayNotes.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                        ) : (
                          displayNotes.map((note) => (
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
                          onClick={() => handleAddNote(selectedSOS.id)}
                          size="sm"
                          className="gap-2"
                          disabled={!newNote.trim()}
                        >
                          <Plus className="h-4 w-4" />
                          Add Note
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {isViewOnly && (
                  <>
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        Proof of Completion (Image)
                      </Label>

                      {selectedSOS.completionProofImageUrl ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            Uploaded {selectedSOS.completionProofUploadedAt ? new Date(selectedSOS.completionProofUploadedAt).toLocaleString('en-MY') : ''}{' '}
                            {selectedSOS.completionProofUploadedBy ? `by ${selectedSOS.completionProofUploadedBy}` : ''}
                          </div>
                          <a
                            href={selectedSOS.completionProofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline"
                          >
                            Open full image
                          </a>
                          <img
                            src={selectedSOS.completionProofImageUrl}
                            alt="Completion proof"
                            className="w-full max-h-64 object-contain border rounded bg-white"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No proof image uploaded.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Case Notes
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 scrollbar-dialog">
                        {displayNotes.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                        ) : (
                          displayNotes.map((note) => (
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
                    </div>
                  </>
                )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
