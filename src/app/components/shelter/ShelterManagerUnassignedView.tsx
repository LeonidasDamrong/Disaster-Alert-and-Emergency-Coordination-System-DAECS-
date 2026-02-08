import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { UserPlus, FileCheck } from 'lucide-react';
import { shelterApi } from '../../lib/api';
import { toast } from 'sonner';

export const ShelterManagerUnassignedView = () => {
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [form, setForm] = useState({ shelterName: '', address: '', totalCapacity: 100 });
  const [submitting, setSubmitting] = useState(false);

  const handleRequestAssignment = () => {
    toast.info('Shelter assignment request will be sent to admin. This feature will be available soon.');
  };

  const handleSubmitRegistration = async () => {
    if (!form.shelterName.trim() || !form.address.trim()) {
      toast.error('Shelter name and address are required');
      return;
    }
    setSubmitting(true);
    try {
      await shelterApi.createRegistrationRequest({
        shelterName: form.shelterName,
        address: form.address,
        totalCapacity: form.totalCapacity,
      });
      toast.success('Shelter registration request submitted. Admin will review it.');
      setRegDialogOpen(false);
      setForm({ shelterName: '', address: '', totalCapacity: 100 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <p className="text-muted-foreground">
            You are not assigned to a shelter yet. Request an assignment or register a new shelter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              className="gap-2"
              onClick={handleRequestAssignment}
            >
              <UserPlus className="h-4 w-4" />
              Request shelter assignment
            </Button>
            <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Request shelter registration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit shelter registration request</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Shelter name *</Label>
                    <Input
                      value={form.shelterName}
                      onChange={(e) => setForm({ ...form, shelterName: e.target.value })}
                      placeholder="e.g. Dewan Serbaguna Kampung Baru"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Address *</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Total capacity</Label>
                    <Input
                      type="number"
                      value={form.totalCapacity}
                      onChange={(e) => setForm({ ...form, totalCapacity: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <Button onClick={handleSubmitRegistration} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
