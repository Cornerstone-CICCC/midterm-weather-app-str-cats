import type { LocationData } from "../types/location";

/** e.g. "British Columbia, Canada" or just "Canada" when region is missing */
export function formatLocationSubtitle(loc: {
  administrative?: string;
  country?: string;
}): string {
  const parts: string[] = [];
  const region = loc.administrative?.trim();
  if (region) parts.push(region);
  const country = loc.country?.trim();
  if (country) parts.push(country);
  return parts.join(", ");
}

export function getCityDisplayName(loc: { city?: string; name?: string }): string {
  return loc.city?.trim() || loc.name?.trim() || "Unknown";
}

export function locationFromPlaceKit(loc: LocationData) {
  return {
    displayName: getCityDisplayName(loc),
    subtitle: formatLocationSubtitle(loc),
    latitude: loc.lat,
    longitude: loc.lng,
  };
}
