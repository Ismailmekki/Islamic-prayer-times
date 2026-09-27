// Holy Kaaba coordinates in Makkah al-Mukarramah
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const radToDeg = (rad: number) => (rad * 180.0) / Math.PI;
const degToRad = (deg: number) => (deg * Math.PI) / 180.0;

/**
 * Calculates the Qibla bearing from a given latitude and longitude.
 * Returns angle in degrees (0 - 360) clockwise from True North.
 */
export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const phi1 = degToRad(latitude);
  const phi2 = degToRad(KAABA_COORDINATES.latitude);
  const deltaLambda = degToRad(KAABA_COORDINATES.longitude - longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = radToDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/**
 * Calculates Great Circle distance to Kaaba in kilometers using Haversine formula.
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth radius in km
  const dLat = degToRad(KAABA_COORDINATES.latitude - latitude);
  const dLon = degToRad(KAABA_COORDINATES.longitude - longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(latitude)) *
      Math.cos(degToRad(KAABA_COORDINATES.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Converts degree to Arabic cardinal direction.
 */
export function getArabicCardinalDirection(degree: number): string {
  const normalized = ((degree % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'شمال';
  if (normalized >= 22.5 && normalized < 67.5) return 'شمال شرق';
  if (normalized >= 67.5 && normalized < 112.5) return 'شرق';
  if (normalized >= 112.5 && normalized < 157.5) return 'جنوب شرق';
  if (normalized >= 157.5 && normalized < 202.5) return 'جنوب';
  if (normalized >= 202.5 && normalized < 247.5) return 'جنوب غرب';
  if (normalized >= 247.5 && normalized < 292.5) return 'غرب';
  return 'شمال غرب';
}
