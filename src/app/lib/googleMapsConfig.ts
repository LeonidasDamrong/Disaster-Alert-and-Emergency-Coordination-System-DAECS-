/**
 * Single Google Maps JS loader config for the app.
 * Keep id, key, and libraries identical everywhere useJsApiLoader is used
 * so the script is not loaded twice with conflicting options.
 */
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

export const googleMapsLoaderOptions = {
  id: 'google-map-script',
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  libraries: ['places'],
};
