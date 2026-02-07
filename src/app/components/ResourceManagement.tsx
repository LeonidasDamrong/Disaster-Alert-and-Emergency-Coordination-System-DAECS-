import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle, XCircle, Truck, Printer } from 'lucide-react';
import { mockResources, mockResourceRequests } from '../lib/mockData';
import { ResourceRequest, ResourceStatus, UrgencyLevel } from '../lib/types';
import { toast } from 'sonner';

export const ResourceManagement = () => {
  const [requests, setRequests] = useState<ResourceRequest[]>(mockResourceRequests);
  const [filterStatus, setFilterStatus] = useState<ResourceStatus | 'All'>('All');
  const [rejectionNote, setRejectionNote] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);

  const filteredRequests = filterStatus === 'All'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const handleApproveRequest = (requestId: string, team: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'Approved' as ResourceStatus,
              assignedTeam: team,
              processedAt: new Date().toISOString()
            }
          : req
      )
    );
    toast.success(`Request approved and assigned to ${team}`);
  };

  const handleRejectRequest = (requestId: string) => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'Rejected' as ResourceStatus,
              rejectionNote,
              processedAt: new Date().toISOString()
            }
          : req
      )
    );
    setRejectionNote('');
    setSelectedRequest(null);
    toast.success('Request rejected');
  };

  const getStatusColor = (status: ResourceStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
    }
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Resource Management</h2>
          <p className="text-gray-600">Manage resource inventory and requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-3xl font-bold mt-1">{requests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold mt-1 text-yellow-600">{requests.filter(r => r.status === 'Pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{requests.filter(r => r.status === 'Approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{requests.filter(r => r.status === 'Delivered').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{requests.filter(r => r.status === 'Rejected').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Resource Inventory</CardTitle>
            <CardDescription>Available resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockResources.map((resource) => (
                <div key={resource.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{resource.itemName}</p>
                      <p className="text-sm text-gray-600">{resource.category}</p>
                      <p className="text-xs text-gray-500 mt-1">{resource.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{resource.quantity}</p>
                      <p className="text-xs text-gray-600">{resource.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resource Requests</CardTitle>
                <CardDescription>Manage resource allocation requests</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ResourceStatus | 'All')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
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
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{request.itemName}</p>
                        <p className="text-xs text-gray-600">{request.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>{request.quantity} {request.unit}</TableCell>
                    <TableCell className="text-sm">{request.destination}</TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'Pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                              Process
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Process Resource Request</DialogTitle>
                              <DialogDescription>Request ID: {request.id}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Requested by:</span>
                                    <p className="font-semibold">{request.requestedBy}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Item:</span>
                                    <p className="font-semibold">{request.itemName}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Quantity:</span>
                                    <p className="font-semibold">{request.quantity} {request.unit}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Destination:</span>
                                    <p className="font-semibold">{request.destination}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Assign Delivery Team</Label>
                                  <Select onValueChange={(value) => handleApproveRequest(request.id, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Team Alpha">Team Alpha</SelectItem>
                                      <SelectItem value="Team Bravo">Team Bravo</SelectItem>
                                      <SelectItem value="Team Charlie">Team Charlie</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Rejection Note (if rejecting)</Label>
                                  <Textarea
                                    value={rejectionNote}
                                    onChange={(e) => setRejectionNote(e.target.value)}
                                    placeholder="Provide reason for rejection..."
                                    rows={3}
                                  />
                                </div>

                                <Button
                                  variant="destructive"
                                  className="w-full gap-2"
                                  onClick={() => handleRejectRequest(request.id)}
                                  disabled={!rejectionNote.trim()}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject Request
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {request.status === 'Approved' && request.assignedTeam && (
                        <div className="text-sm">
                          <p className="flex items-center gap-1 text-blue-600">
                            <Truck className="h-3 w-3" />
                            {request.assignedTeam}
                          </p>
                        </div>
                      )}
                      {request.status === 'Delivered' && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Button className="gap-2" onClick={() => toast.success('Resource usage report generated')}>
            <Printer className="h-4 w-4" />
            Generate Resource Usage Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};