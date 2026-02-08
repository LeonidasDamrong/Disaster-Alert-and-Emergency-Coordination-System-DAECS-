import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { AdminShelterView } from './shelter/AdminShelterView';
import { ShelterManagerAssignedView } from './shelter/ShelterManagerAssignedView';
import { ShelterManagerUnassignedView } from './shelter/ShelterManagerUnassignedView';
import { shelterApi } from '../lib/api';
import type { Shelter } from '../lib/types';

/**
 * Shelter Management module: role-based UI.
 * - Admin / System Admin: full CRUD, view all shelters, assign manager, approve registration, print report.
 * - Shelter Manager (assigned): single-shelter view — register evacuee, request resource (placeholder), request registration, generate report.
 * - Shelter Manager (unassigned): blank page with "Request shelter assignment" and "Request shelter registration".
 */
export const ShelterManagement = () => {
  const { user, hasAnyRole, hasRole } = useAuth();
  const [myShelter, setMyShelter] = useState<Shelter | null | undefined>(undefined); // undefined = loading

  const isAdmin = hasAnyRole(['Admin', 'System Admin']);
  const isShelterManager = hasRole('Shelter Manager');

  useEffect(() => {
    if (!isShelterManager) return;
    let cancelled = false;
    shelterApi.getMyShelter().then((s) => {
      if (!cancelled) setMyShelter(s);
    }).catch(() => {
      if (!cancelled) setMyShelter(null);
    });
    return () => { cancelled = true; };
  }, [isShelterManager]);

  if (!user) return null;

  if (isAdmin) {
    return <AdminShelterView />;
  }

  if (isShelterManager) {
    if (myShelter === undefined) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }
    if (myShelter === null) {
      return <ShelterManagerUnassignedView />;
    }
    return (
      <ShelterManagerAssignedView
        shelter={myShelter}
        onRefresh={async () => {
          const s = await shelterApi.getMyShelter();
          setMyShelter(s ?? null);
        }}
      />
    );
  }

  return (
    <div className="p-6 text-center text-muted-foreground">
      You do not have access to Shelter Management.
    </div>
  );
};
