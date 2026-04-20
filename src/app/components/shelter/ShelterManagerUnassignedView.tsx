import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { UserPlus, FileCheck } from 'lucide-react';
import { shelterApi } from '../../lib/api';
import { toast } from 'sonner';
import { PlacesAddressAutocomplete } from '../PlacesAddressAutocomplete';
import { hasValidShelterCoords } from '../../lib/shelterCoords';
import { ConfirmDialog } from '../ConfirmDialog';

const emptyRegForm = () => ({
  shelterName: '',
  address: '',
  latitude: null as number | null,
  longitude: null as number | null,
  totalCapacity: 100,
});

export const ShelterManagerUnassignedView = () => {
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyRegForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitRegConfirmOpen, setSubmitRegConfirmOpen] = useState(false);

  const handleRequestAssignment = () => {
    toast.info('Shelter assignment request will be sent to admin. This feature will be available soon.');
  };

  const requestSubmitRegistration = () => {
    if (!form.shelterName.trim() || !form.address.trim()) {
      toast.error('Shelter name and address are required');
      return;
    }
    if (!hasValidShelterCoords(form.latitude, form.longitude)) {
      toast.error('Pick a full address from the Google suggestions so coordinates can be saved');
      return;
    }
    setSubmitRegConfirmOpen(true);
  };

  const performSubmitRegistration = async () => {
    setSubmitting(true);
    try {
      await shelterApi.createRegistrationRequest({
        shelterName: form.shelterName,
        address: form.address,
        latitude: form.latitude!,
        longitude: form.longitude!,
        totalCapacity: form.totalCapacity,
      });
      toast.success('Shelter registration request submitted. Admin will review it.');
      setRegDialogOpen(false);
      setForm(emptyRegForm());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit request');
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-2">
            <p className="text-lg sm:text-xl font-semibold tracking-tight">No shelter assigned yet</p>
            <p className="text-sm sm:text-base text-muted-foreground max-w-prose mx-auto">
              Request an assignment from an admin, or submit a registration request for a new shelter.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="default" className="gap-2 h-11" onClick={handleRequestAssignment}>
              <UserPlus className="h-4 w-4" />
              Request assignment
            </Button>
            <Dialog
              open={regDialogOpen}
              onOpenChange={(open) => {
                setRegDialogOpen(open);
                if (open) setForm(emptyRegForm());
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 h-11">
                  <FileCheck className="h-4 w-4" />
                  Register a shelter
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
                    <PlacesAddressAutocomplete
                      value={form.address}
                      onChange={(address) => setForm((f) => ({ ...f, address }))}
                      onPlaceResolved={(p) =>
                        setForm((f) =>
                          p
                            ? { ...f, address: p.address, latitude: p.latitude, longitude: p.longitude }
                            : { ...f, latitude: null, longitude: null },
                        )
                      }
                      placeholder="Search address in Malaysia"
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
                  <Button className="h-11" onClick={requestSubmitRegistration} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={submitRegConfirmOpen}
        onOpenChange={setSubmitRegConfirmOpen}
        title="Submit shelter registration request?"
        description={
          <span>
            Send <strong>{form.shelterName || '—'}</strong> (capacity {form.totalCapacity}) to admin for review? You can submit only one request per flow; ensure details are correct.
          </span>
        }
        confirmLabel="Yes, submit request"
        confirmButtonClassName="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600 text-white"
        onConfirm={performSubmitRegistration}
      />
    </div>
  );
};
