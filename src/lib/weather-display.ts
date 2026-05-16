import type { WeatherData } from "../types/weather";

export const FALLBACK_CITY = {
  displayName: "Vancouver",
  latitude: 49.2827,
  longitude: -123.1207,
} as const;

export const GEO_LOCATION_LABEL = "Your location";

export function getTodayMinMax(
  weather: WeatherData,
): { min: number; max: number } | null {
  const dayPrefix = weather.current.time.slice(0, 10);
  const temps: number[] = [];
  for (let i = 0; i < weather.hourly.time.length; i++) {
    if (weather.hourly.time[i].startsWith(dayPrefix)) {
      temps.push(weather.hourly.temperature_2m[i]);
    }
  }
  if (!temps.length) return null;
  return { min: Math.min(...temps), max: Math.max(...temps) };
}
