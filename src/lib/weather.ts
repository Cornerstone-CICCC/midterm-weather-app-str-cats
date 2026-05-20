import type { WeatherData } from "../types/weather";

/**
 * @function getWeatherInfo
 * @param lng - Longitude of the location for which to fetch weather information
 * @param lat - Latitude of the location for which to fetch weather information
 * @description This function fetches weather information from the Open-Meteo API.
 * @returns {Promise<WeatherData>} An object containing current, daily, and hourly weather data.
 */
export async function getWeatherInfo(
  lng: number,
  lat: number,
): Promise<WeatherData> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m,rain,snowfall,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`,
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}

/**
 * @function getWeatherEmoji
 * @param {number} code - WMO weather interpretation code
 * @description Converts WMO interpretation codes into visual weather emojis
 */
export function getWeatherEmoji(code: number) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([56, 57].includes(code)) return "❄️🌦️";
  if ([61, 63, 65].includes(code)) return "🌧️";
  if ([66, 67].includes(code)) return "❄️🌧️";
  if ([71, 73, 75].includes(code)) return "❄️";
  if (code === 77) return "🌨️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([85, 86].includes(code)) return "🌨️";
  if (code >= 95) return "⛈️";
  return "❓";
}
