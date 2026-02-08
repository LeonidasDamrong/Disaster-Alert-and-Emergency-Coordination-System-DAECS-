import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { UserPlus, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

export const ShelterManagerUnassignedView = () => {
  const handleRequestAssignment = () => {
    toast.info('Shelter assignment request will be sent to admin. This feature will be available soon.');
  };

  const handleRequestRegistration = () => {
    toast.info('Shelter registration request will be sent to admin. This feature will be available soon.');
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
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRequestRegistration}
            >
              <FileCheck className="h-4 w-4" />
              Request shelter registration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
