import { useEffect, useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Input } from './ui/input';
import { googleMapsLoaderOptions } from '../lib/googleMapsConfig';
import { ensureGooglePacDropdownStyles } from '../lib/googlePacDropdownStyles';
import { cn } from './ui/utils';

export type ResolvedPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type PlacesAddressAutocompleteProps = {
  value: string;
  onChange: (address: string) => void;
  /** Called when the user picks a suggestion (with coordinates) or when the address is edited manually (null). */
  onPlaceResolved: (place: ResolvedPlace | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Malaysia-only Google Places autocomplete. Requires VITE_GOOGLE_MAPS_API_KEY and Places API enabled.
 */
export function PlacesAddressAutocomplete({
  value,
  onChange,
  onPlaceResolved,
  placeholder,
  disabled,
  id,
  className,
}: PlacesAddressAutocompleteProps) {
  const { isLoaded, loadError } = useJsApiLoader(googleMapsLoaderOptions);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isLoaded || loadError) return;
    ensureGooglePacDropdownStyles();
  }, [isLoaded, loadError]);

  const handleInputChange = (next: string) => {
    onChange(next);
    onPlaceResolved(null);
  };

  if (!isLoaded || loadError) {
    return (
      <div className={cn('grid gap-1', className)}>
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        {loadError ? (
          <p className="text-xs text-destructive">Could not load Google Places. Check your API key and network.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Loading address search…</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-1', className)}>
      <Autocomplete
        onLoad={(ac) => {
          autocompleteRef.current = ac;
        }}
        onUnmount={() => {
          autocompleteRef.current = null;
        }}
        options={{
          componentRestrictions: { country: 'my' },
          fields: ['formatted_address', 'geometry', 'name'],
        }}
        onPlaceChanged={() => {
          const ac = autocompleteRef.current;
          if (!ac) return;
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) {
            onPlaceResolved(null);
            return;
          }
          const name = place.name ?? '';
          const address = place.formatted_address ?? '';
          onChange(address);
          onPlaceResolved({
            name,
            address,
            latitude: loc.lat(),
            longitude: loc.lng(),
          });
        }}
      >
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => ensureGooglePacDropdownStyles()}
          onKeyDown={() => queueMicrotask(() => ensureGooglePacDropdownStyles())}
        />
      </Autocomplete>
      <p className="text-xs text-muted-foreground">Choose an address from the suggestions (Malaysia).</p>
    </div>
  );
}
