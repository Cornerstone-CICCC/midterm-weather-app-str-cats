import type { HourlyWeather, WeatherData } from "../types/weather";

/**
 * @function mapHourly
 * @description Maps the hourly weather data to a more usable format, filtering to every 3 hours.
 * @param {WeatherData["hourly"]} hourly - The hourly weather data from the API response.
 * @returns {HourlyWeather[]} An array of hourly weather data, filtered to every 3 hours.
 */
export function mapHourly(hourly: WeatherData["hourly"]) {
  return hourly.time
    .map((time, index) => ({
      time,
      temperature: hourly.temperature_2m[index],
      rain: hourly.rain[index],
      snowfall: hourly.snowfall[index],
    }))
    .filter((_, index) => index % 3 === 0);
}
