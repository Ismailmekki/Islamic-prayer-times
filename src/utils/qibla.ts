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
  if (normalized >= 337.5 || normalized < 22.5) return 'شمال (N)';
  if (normalized >= 22.5 && normalized < 67.5) return 'شمال شرق (NE)';
  if (normalized >= 67.5 && normalized < 112.5) return 'شرق (E)';
  if (normalized >= 112.5 && normalized < 157.5) return 'جنوب شرق (SE)';
  if (normalized >= 157.5 && normalized < 202.5) return 'جنوب (S)';
  if (normalized >= 202.5 && normalized < 247.5) return 'جنوب غرب (SW)';
  if (normalized >= 247.5 && normalized < 292.5) return 'غرب (W)';
  return 'شمال غرب (NW)';
}

/**
 * Compute reliable compass heading from device Euler angles (alpha, beta, gamma).
 * Alpha: 0-360 (compass orientation in W3C specification)
 * Beta: -180 to 180 (pitch, front/back tilt)
 * Gamma: -90 to 90 (roll, left/right tilt)
 */
export function computeTiltCompensatedHeading(
  alpha: number,
  beta?: number | null,
  gamma?: number | null
): number {
  if (typeof alpha !== 'number' || isNaN(alpha)) return 0;

  // In W3C specification, when phone is held flat or nearly flat (standard compass reading):
  // alpha represents rotation counter-clockwise from North, so heading = (360 - alpha) % 360
  if (
    beta === null ||
    beta === undefined ||
    gamma === null ||
    gamma === undefined ||
    (Math.abs(beta) <= 45 && Math.abs(gamma) <= 45)
  ) {
    const heading = (360 - alpha + 360) % 360;
    return Math.round(heading * 10) / 10;
  }

  const deg = Math.PI / 180;
  const a = alpha * deg;
  const b = beta * deg;
  const g = gamma * deg;

  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  const sg = Math.sin(g);

  // Vector pointing along device's Y-axis (top of screen) projected onto Earth horizontal plane
  const Vx = -sa * cb - ca * sg * sb;
  const Vy = ca * cb - sa * sg * sb;

  if (Math.abs(Vx) < 0.001 && Math.abs(Vy) < 0.001) {
    const heading = (360 - alpha + 360) % 360;
    return Math.round(heading * 10) / 10;
  }

  let heading = Math.atan2(Vx, Vy) * (180 / Math.PI);
  heading = (heading + 360) % 360;
  return Math.round(heading * 10) / 10;
}

/**
 * Calculates current Sun Azimuth & Altitude for celestial solar verification of Qibla.
 */
export function calculateSunPosition(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): { azimuth: number; altitude: number; isVisible: boolean; relationToQibla: string } {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const dayOfYear =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
    24 /
    60 /
    60 /
    1000;
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);

  // Equation of time in minutes
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination in radians
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma);

  // True solar time in minutes
  const timeOffset = eqtime + 4 * longitude;
  let tst = utcHours * 60 + timeOffset;
  tst = ((tst % 1440) + 1440) % 1440;

  // Solar hour angle in degrees
  const ha = tst / 4 - 180;
  const haRad = ha * rad;
  const latRad = latitude * rad;

  // Solar zenith angle
  const cosZenith =
    Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const altitude = 90 - zenith * deg;

  // Solar azimuth (clockwise from North)
  const cosAzimuth =
    (Math.sin(decl) - Math.sin(latRad) * cosZenith) / (Math.cos(latRad) * Math.sin(zenith));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * deg;
  if (ha > 0) {
    azimuth = (360 - azimuth) % 360;
  }

  const roundedAzimuth = Math.round(azimuth);
  const qibla = calculateQiblaBearing(latitude, longitude);
  const diff = ((qibla - roundedAzimuth + 540) % 360) - 180;

  let relationToQibla = '';
  if (altitude > 0) {
    if (Math.abs(diff) <= 8) {
      relationToQibla = 'الشمس حالياً في نفس اتجاه القبلة مباشرة! (يمكنك الصلاة باتجاه الشمس)';
    } else if (diff > 0) {
      relationToQibla = `القبلة تقع على يمين الشمس بزاوية ${Math.round(diff)}° تقريباً`;
    } else {
      relationToQibla = `القبلة تقع على يسار الشمس بزاوية ${Math.abs(Math.round(diff))}° تقريباً`;
    }
  } else {
    relationToQibla = 'الشمس حالياً تحت الأفق (ليلاً)';
  }

  return {
    azimuth: roundedAzimuth,
    altitude: Math.round(altitude * 10) / 10,
    isVisible: altitude > 0,
    relationToQibla,
  };
}
