export type WeatherData = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;

  current_units: CurrentUnits;
  current: CurrentData;

  hourly_units: HourlyUnits;
  hourly: HourlyData;

  daily_units: DailyUnits;
  daily: DailyData;
};

export type HourlyWeather = {
  time: string;
  temperature: number;
  rain: number;
  snowfall: number;
  weather_code: number;
};

interface CurrentUnits {
  time: string;
  interval: string;
  temperature_2m: string;
  weather_code: string;
}

interface CurrentData {
  time: string;
  interval: number;
  temperature_2m: number;
  weather_code: number;
}

interface HourlyUnits {
  time: string;
  temperature_2m: string;
  rain: string;
  snowfall: string;
  weather_code: string;
}

interface HourlyData {
  time: string[];
  temperature_2m: number[];
  rain: number[];
  snowfall: number[];
  weather_code: number[];
}

interface DailyUnits {
  time: string;
  sunrise: string;
  sunset: string;
}

interface DailyData {
  time: string[];
  sunrise: string[];
  sunset: string[];
}