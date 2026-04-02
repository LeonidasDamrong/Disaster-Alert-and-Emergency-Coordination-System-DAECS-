/** True when coords came from a Places selection (not 0,0 and finite). */
export function hasValidShelterCoords(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  return Number.isFinite(lat) && Number.isFinite(lng);
}
