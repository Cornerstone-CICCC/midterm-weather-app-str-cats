import type { WeatherData } from "../types/weather";

/**
 *@function getWeatherInfo
 * @param lng - Longitude of the location for which to fetch weather information
 * @param lat - Latitude of the location for which to fetch weather information
 * @description This function fetches weather information from the Open-Meteo API based on the provided
 * longitude and latitude.
 * @returns <WeatherData> An object containing current temperature, daily weather data, and hourly weather
 * data for every 3 hours of the next 5 days.
 */
export async function getWeatherInfo(
  lng: number,
  lat: number,
): Promise<WeatherData> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m,rain,snowfall,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=5`,
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}
