import type { WeatherData } from "../types/weather";

/**
 * @function getWeatherInfo
 * @param lng - Longitude of the location for which to fetch weather information
 * @param lat - Latitude of the location for which to fetch weather information
 * @description This function fetches weather information from the Open-Meteo API.
 * @returns {Promise<WeatherData>} An object containing current, daily, and hourly weather data.
 */
// export async function getWeatherInfo(
//   lng: number,
//   lat: number,
// ): Promise<WeatherData> {
//   const response = await fetch(
//     `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,rain,apparent_temperature&hourly=temperature_2m,rain,snowfall,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`,
//   );

//   if (!response.ok) {
//     throw new Error(`Weather request failed (${response.status})`);
//   }
//   return response.json() as Promise<WeatherData>;
// }

export async function getWeatherInfo(
  lng: number,
  lat: number,
): Promise<WeatherData> {
  // Fetch main weather data
    const airResponse = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=uv_index,european_aqi`
  );
  if (!airResponse.ok) {
    throw new Error(`Air quality request failed (${airResponse.status})`);
  }
  const airData = await airResponse.json();

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,rain,apparent_temperature&hourly=temperature_2m,rain,snowfall,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`
  );
  if (!weatherResponse.ok) {
    throw new Error(`Weather request failed (${weatherResponse.status})`);
  }
  const weatherData = await weatherResponse.json() as WeatherData;
  if (weatherData.current) {
    weatherData.current.uv_index =
      airData.current?.uv_index ?? null;

    weatherData.current.european_aqi =
      airData.current?.european_aqi ?? null;
  }

  return weatherData;
}


