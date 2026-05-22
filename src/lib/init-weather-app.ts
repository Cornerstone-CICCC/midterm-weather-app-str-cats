import $ from "jquery";

// * Local imports
import {
  bindFavorites,
  hideFavoriteList,
  refreshFavoriteStar,
  renderFavoriteDropdown,
} from "./favorites-dropdown";
import { getGeolocation } from "./geolocation";
import { bindSearchBar, hideSearchResults } from "./search-bar";
import type { RecentSearchCity } from "./search-bar";
// - Weather fetching and formatting
import {
  FALLBACK_CITY,
  GEO_LOCATION_LABEL,
  getTodayMinMax,
} from "./weather-display";
import { mapHourly, mapDailyForecast, mapHourlyRange } from "./weather-mapper";
// - Types
import { getWeatherInfo } from "./weather";
import type {
  WeatherData,
  DailyForecast,
  HourlyForecast,
} from "../types/weather";

type SelectedCity = {
  displayName: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

let selectedCity: SelectedCity = { ...FALLBACK_CITY };
// Application state for layout mappings
let allHourlyData: HourlyForecast[] = [];

/**
 * @function updateHourlyUI
 * @param {string} targetDate - The date string (YYYY-MM-DD) to filter hourly data for
 * @description Dynamically updates the pre-rendered HoursCard elements with filtered data
 */
function updateHourlyUI(targetDate: string): void {
  const $hourlyTitle = $("#hourly-title");
  const titleDate = new Date(targetDate.replace(/-/g, "/"));
  $hourlyTitle.text(
    `${titleDate.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })} Hourly Forecast`,
  );

  const filteredHourly = allHourlyData.filter((item) =>
    item.time.startsWith(targetDate),
  );
  const $hourItems = $(".hour-item");

  $hourItems.each((index, element) => {
    const $item = $(element);
    const data = filteredHourly[index];

    if (data) {
      const timeLabel = new Date(data.time).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
      const emoji = getWeatherEmoji(data.weatherCode);

      $item.find(".hour-time").text(timeLabel);
      $item.find(".hour-emoji").html(emoji);
      $item.find(".hour-temp").text(`${data.temperature}°`);
      $item.show();
    } else {
      $item.hide();
    }
  });
}


/** Highlight the clicked day card; remove highlight from the others. */
function setActiveDayCard($activeCard: JQuery<HTMLElement>): void {
  const activeDayClasses = "bg-neutral-100 shadow-inner shadow-black/30";
  $(".day-card").removeClass(activeDayClasses);
  $activeCard.addClass(activeDayClasses);
}

/**
 * @function updateDailyUI
 * @param {DailyForecast[]} daily - Array of daily forecast data to map into the UI
 * @description Updates the pre-rendered DayCard components with real API data and attaches click events
 */
function updateDailyUI(daily: DailyForecast[]): void {
  const $dayCards = $(".day-card");

  $dayCards.each((index, element) => {
    const $card = $(element);
    const data = daily[index];

    if (data) {
      const dateObj = new Date(data.date.replace(/-/g, "/"));
      const dayName = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const dateString = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      const emoji = getWeatherEmoji(data.weatherCode);

      // Map dynamic data into DayCard layout structure without breaking alignment
      $card.attr("data-date", data.date);

      $card.find(".day-name").html(`
        <span style="font-weight: bold; display: block;">${dayName}</span>
        <span style="font-size: 0.8rem; color: #888; font-weight: normal; display: block; margin-top: 2px;">${dateString}</span>
      `);

      $card
        .find(".weather-icon-temp")
        .html(`<span style="font-size: 1.5rem;">${emoji}</span>`);
      $card.find(".max-temp").text(`${data.maxTemp}°`);
      $card.find(".min-temp").text(`${data.minTemp}°`);

      $card.css("cursor", "pointer");

$card.off("click").on("click", function () {
        const selectedDate = $(this).attr("data-date");
        if (selectedDate) {
          updateHourlyUI(selectedDate);
          setActiveDayCard($(this));
        }
      });
    }
  });
}

/**
 * @function resolveInitialCity
 * @description Resolves the initial city based on the user's geolocation.
 * @returns {Promise<void>} A promise that resolves when the initial city is resolved.
 */
async function resolveInitialCity(): Promise<void> {
  try {
    const loc = await getGeolocation();
    selectedCity = {
      displayName: GEO_LOCATION_LABEL,
      subtitle: "",
      latitude: loc.lat,
      longitude: loc.lng,
    };
  } catch {
    selectedCity = { ...FALLBACK_CITY };
  }
}

function renderLocationSubtitle(): void {
  const $sub = $("#hero-location-subtitle");
  if (selectedCity.subtitle) {
    $sub.text(selectedCity.subtitle).removeClass("hidden");
  } else {
    $sub.text("").addClass("hidden");
  }
}

/**
 * @function renderWeatherCard
 * @description Renders the weather card for the selected city.
 * @param {WeatherData} weather - The weather data to render.
 * @returns {void}
 */
function renderWeatherCard(weather: WeatherData): void {
  $("#hero-city-name").text(selectedCity.displayName);
  renderLocationSubtitle();

  const unit = weather.current_units.temperature_2m;
  $("#hero-temp-main").text(`${weather.current.temperature_2m}${unit}`);
  $("#hero-feels-like").text(`${weather.current.apparent_temperature}`);
  $("#hero-wind").text(`${weather.current.wind_speed_10m} km/h`);
  $("#hero-humidity").text(`${weather.current.relative_humidity_2m} %`);

  function getUvLevel(uv) {
  if (uv === null || uv === undefined) return "unknown";

  if (uv <= 2) return `low (${uv})`;
  if (uv <= 5) return `moderate (${uv})`;
  if (uv <= 7) return `high (${uv})`;
  if (uv <= 10) return `very-high (${uv})`;

  return `extreme (${uv})`;
}

function getAirQualityLevel(aqi) {
  if (aqi === null || aqi === undefined) return "unknown";

  if (aqi <= 20) return `good (${aqi})`;
  if (aqi <= 40) return `fair (${aqi})`;
  if (aqi <= 60) return `moderate (${aqi})`;
  if (aqi <= 80) return `poor (${aqi})`;
  if (aqi <= 100) return `very poor (${aqi})`;

  return `extremely poor (${aqi})`;
}

  $("#hero-uv").text(getUvLevel(weather.current.uv_index));

  $("#hero-air-quality").text(getAirQualityLevel(weather.current.european_aqi));


  $("#hero-uv").text(getUvLevel(weather.current.uv_index));

  $("#hero-air-quality").text(getAirQualityLevel(weather.current.european_aqi));

  // Format Sunrise and Sunset
  const sunriseRaw = weather.daily.sunrise[0];
  const sunsetRaw = weather.daily.sunset[0];

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  $("#hero-sunrise").text(formatTime(sunriseRaw));
  $("#hero-sunset").text(formatTime(sunsetRaw));

  const nowTime = new Date(weather.current.time).getTime();
  const sunriseTime = new Date(weather.daily.sunrise[0]).getTime();
  const sunsetTime = new Date(weather.daily.sunset[0]).getTime();
  const isDaytime = nowTime >= sunriseTime && nowTime < sunsetTime;

  //Get the weather icon 
  const iconFilename = getWeatherIconFilename(weather.current.weather_code, isDaytime);
  $("#hero-weather").attr("src", `/assets/weather-animated/${iconFilename}`);

  // Get the cat mascot
  const catFilename = getWeatherCatFilename(weather.current.weather_code);
  $("#cat-mascot").attr("src", `/assets/cats/${catFilename}`);

  // get hero card bg and logo
  const bgFilename = getWeatherBgFilename(weather.current.weather_code);
  $("#hero-bg").attr("src", `/assets/bg-laptop/${bgFilename}`);

  const logoFilename = getWeatherLogoFilename(weather.current.weather_code);
  $("#footer-logo").attr("src", `/assets/logo/${logoFilename}`);


  const conditionText = getWeatherDescription(weather.current.weather_code);
  $("#hero-condition").text(conditionText);

  const range = getTodayMinMax(weather);
  if (range) {
    $("#hero-temp-range").text(`${range.min}${unit} - ${range.max}${unit}`);
  } else {
    $("#hero-temp-range").text("—");
  }

  const precipProb = weather.hourly.precipitation_probability[0];
  const snowAmt = weather.hourly.snowfall[0];

  // rain / snow for current weather card
  $("#hero-precipitation").text(`${precipProb}%`);
  $("#hero-snowfall").text(`${snowAmt}mm`);

  const rain0 = weather.hourly.rain[0];
  const snow0 = weather.hourly.snowfall[0];
  $("#hero-rain-value").text(`${rain0} ${weather.hourly_units.rain}`);
  $("#hero-snow-value").text(`${snow0} ${weather.hourly_units.snowfall}`);

  $("#hero-status").addClass("hidden").text("");

  // --- Extended Layout Components Processing ---
  const dailyForecasts = mapDailyForecast(weather.daily);
  const hourlyRange = mapHourlyRange(weather.hourly);
  allHourlyData = mapHourly(weather.hourly);

  // Update Daily Cards
  updateDailyUI(dailyForecasts);

  // Initialize Hourly Panel state mapping 
if (dailyForecasts.length > 0) {
    updateHourlyUI(dailyForecasts[0].date);
    setActiveDayCard($(".day-card").first());
  }

  console.warn("--- Final Mapped Data ---");
  console.log("1. 5-Day Forecast Data:", dailyForecasts);
  console.log("2. 3-Hour Interval Data (Next 24h):", hourlyRange);
  console.log("3. mapHourly Check:", allHourlyData);
}

/**
 * @function loadWeatherForSelected
 * @description Loads the weather for the selected city.
 * @returns {Promise<void>} A promise that resolves when the weather is loaded.
 */
async function loadWeatherForSelected(): Promise<void> {
  const $status = $("#hero-status");
  $status.removeClass("hidden").text("Loading forecast…");

  try {
    const weather = await getWeatherInfo(
      selectedCity.longitude,
      selectedCity.latitude,
    );
    renderWeatherCard(weather);
    refreshFavoriteStar();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load weather.";
    $status.removeClass("hidden").text(message);
    $("#hero-temp-main").text("—");
    $("#hero-temp-range").text("—");
    $("#hero-rain-value").text("—");
    $("#hero-snow-value").text("—");
    renderLocationSubtitle();
    refreshFavoriteStar();
  }
}

/**
 * @function bindClickOutsideDropdowns
 * @description Hides open dropdowns when clicking outside their containers.
 * @returns {void}
 */
function bindClickOutsideDropdowns(): void {
  $(document).on("click", (e) => {
    const target = e.target as Node;
    const $searchWrap = $("#search-city-input").parent();
    if ($searchWrap.length && !$searchWrap[0]?.contains(target)) {
      hideSearchResults();
    }
    const $favWrap = $("#favorite-cities-trigger").parent();
    if ($favWrap.length && !$favWrap[0]?.contains(target)) {
      hideFavoriteList();
    }
  });
}

/**
 *
 */
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodes[code] || "Unknown";
}

/**
 * @function getWeatherEmoji
 * @param {number} code - WMO weather interpretation code
 * @description Converts WMO interpretation codes into dynamic weather SVG image elements using default src folder paths
 */
export function getWeatherEmoji(code: number): string {
  let assetName = "0-day.svg";

  if (code === 0) assetName = "0-day.svg";
  else if ([1, 2, 3].includes(code)) assetName = "1,2,3-day.svg";
  else if ([45, 48].includes(code)) assetName = "45,48.svg";
  else if ([51, 53, 55].includes(code)) assetName = "51,53,55.svg";
  else if ([56, 57].includes(code)) assetName = "56,57.svg";
  else if ([61, 63, 65].includes(code)) assetName = "61,63,65.svg";
  else if ([66, 67].includes(code)) assetName = "66,67.svg";
  else if ([71, 73, 75].includes(code)) assetName = "71,73,75.svg";
  else if (code === 77) assetName = "77.svg";
  else if ([80, 81, 82].includes(code)) assetName = "80,81,82.svg";
  else if ([85, 86].includes(code)) assetName = "85,86.svg";
  else if (code >= 95) assetName = "95,96,99.svg";

  return `<img src="../src/assets/weather-static/${assetName}" alt="Weather Icon" class="w-7 h-7 object-contain object-center" />`;
}

/**
 * Returns the corresponding image filename based on the weather code and day/night status.
 * @param code - The current weather code from the Open-Meteo API
 * @param isDay - Boolean indicating if it is currently daytime
 * @returns The filename of the SVG weather icon
 */
function getWeatherIconFilename(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "0-day.svg" : "0-night.svg";
  if ([1, 2, 3].includes(code)) return isDay ? "1,2,3-day.svg" : "1,2,3-night.svg";
  
  if ([45, 48].includes(code)) return "45,48.svg";
  if ([51, 53, 55].includes(code)) return "51,53,55.svg";
  if ([56, 57].includes(code)) return "56,57.svg";
  if ([61, 63, 65].includes(code)) return "61,63,65.svg";
  if ([66, 67].includes(code)) return "66,67.svg";
  if ([71, 73, 75].includes(code)) return "71,73,75.svg";
  if (code === 77) return "77.svg";
  if ([80, 81, 82].includes(code)) return "80,81,82.svg";
  if ([85, 86].includes(code)) return "85,86.svg";
  if ([95, 96, 99].includes(code)) return "95,96,99.svg";
  
  // Return clear sky as default if no match is found
  return isDay ? "0-day.svg" : "0-night.svg";
}

/**
 * Returns the corresponding cat mascot filename based on the weather code.
 * @param code - The current weather code from the Open-Meteo API
 * @returns The filename of the cat mascot image (assuming they are placed in public/assets/)
 */
function getWeatherCatFilename(code: number): string {
  // Sunny / Clear / slightly cloudy
  if ([0, 1].includes(code)) return "sunny.png";

  // Cloudy / Foggy
  if ([2, 3, 45, 48].includes(code)) return "cloudy.png";

  // Rainy / Showers / Thunderstorms / Wet Weather
  if ([
    51, 53, 55, 56, 57, // Drizzle
    61, 63, 65, 66, 67, // Rain
    80, 81, 82,         // Rain showers
    95, 96, 99          // Thunderstorm
  ].includes(code)) return "rainy.png";

  // Snowy / Sleet / Freezing Weather
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy.png";

  // Default to Sunny cat
  return "sunny.png";
}

/**
 * Returns the corresponding background filename based on the weather code.
 * @param code - The current weather code from the Open-Meteo API
 * @returns The filename of the background SVG
 */
function getWeatherBgFilename(code: number): string {
  // Sunny
  if ([0, 1].includes(code)) return "Property 1=sunny.svg";
  // Cloudy
  if ([2, 3, 45, 48].includes(code)) return "Property 1=cloudy.svg";
  // Rainy
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return "Property 1=rainy.svg";
  // Snowy 
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Property 1=Default.svg";
  
  return "Property 1=sunny.svg";
}

/**
 * Returns the corresponding logo filename based on the weather code.
 * @param code - The current weather code from the Open-Meteo API
 * @returns The filename of the logo SVG
 */
function getWeatherLogoFilename(code: number): string {
  // Sunny or Snowy -> Black Logo
  if ([0, 1, 71, 73, 75, 77, 85, 86].includes(code)) return "logo=long-black.svg";
  // Cloudy or Rainy -> White Logo
  return "logo=long-white.svg";
}



/**
 * Wire StrCats Weather UI to PlaceKit, Open-Meteo, and favorites (localStorage).
 * Call once on DOM ready (see index.astro).
 */
export async function initWeatherApp(): Promise<void> {
  await resolveInitialCity();
  renderFavoriteDropdown();
  refreshFavoriteStar();
  await loadWeatherForSelected();

  bindFavorites({
    getSelectedCity: () => selectedCity,
    onCitySelected: (city) => {
      selectedCity = city;
      void loadWeatherForSelected();
    },
  });
  bindSearchBar({
    onCitySelected: (city: RecentSearchCity) => {
      selectedCity = city;
      void loadWeatherForSelected();
    },
  });
  bindClickOutsideDropdowns();
}
