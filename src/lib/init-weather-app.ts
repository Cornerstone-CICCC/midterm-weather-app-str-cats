import $ from "jquery";

// * Local imports
// - Fovorite management
import {
  addFavorite,
  createFavoriteId,
  isFavorite,
  loadFavorites,
  removeFavoriteById,
} from "./favorites";
// - Geolocation and place search
import { getGeolocation } from "./geolocation";
import {
  formatLocationSubtitle,
  getCityDisplayName,
  locationFromPlaceKit,
} from "./location-format";
import { searchPlaces } from "./placekit";
// - Weather fetching and formatting
import {
  FALLBACK_CITY,
  GEO_LOCATION_LABEL,
  getTodayMinMax,
} from "./weather-display";
import {
  mapHourly,
  mapDailyForecast,
  mapHourlyRange,
} from "./weather-mapper";
// - Types
import { getWeatherInfo } from "./weather";
import type { FavoriteCity } from "../types/favorite-city";
import type { LocationData } from "../types/location";
import type { WeatherData, DailyForecast, HourlyForecast } from "../types/weather";

type SelectedCity = {
  displayName: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

let selectedCity: SelectedCity = { ...FALLBACK_CITY };
let favoritesCache: FavoriteCity[] = loadFavorites();
let searchDebounceId: ReturnType<typeof setTimeout> | undefined;

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
      $item.find(".hour-emoji").text(emoji);
      $item.find(".hour-temp").text(`${data.temperature}°`);
      $item.show();
    } else {
      $item.hide();
    }
  });
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

      // Smoothly toggle highlight using fine borders instead of breaking background layers
      $card.off("click").on("click", function () {
        const selectedDate = $(this).attr("data-date");
        if (selectedDate) {
          updateHourlyUI(selectedDate);
          // Reset all cards to their default component styling
          $(".day-card").css({
            border: "1px solid #eee",
            "box-shadow": "none",
          });
          // Emphasize the active card seamlessly without shifting heights
          $(this).css({
            border: "1px solid #333",
            "box-shadow": "inset 0 0 5px rgba(0,0,0,0.05)",
          });
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

/**
 * @function renderFavoriteDropdown
 * @description Renders the favorite dropdown.
 * @returns {void}
 */
function renderFavoriteDropdown(): void {
  favoritesCache = loadFavorites();
  const $sel = $("#favorite-cities");
  $sel.empty();
  $("<option>", { value: "", text: "Favorite cities" }).appendTo($sel);
  for (const fav of favoritesCache) {
    const label = fav.subtitle
      ? `${fav.displayName} — ${fav.subtitle}`
      : fav.displayName;
    $("<option>", { value: fav.id, text: label }).appendTo($sel);
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
 * @function refreshStarState
 * @description Refreshes the state of the favorite toggle button.
 * @returns {void}
 */
function refreshStarState(): void {
  const active = isFavorite(selectedCity.latitude, selectedCity.longitude);
  const $btn = $("#favorite-toggle");
  $btn.attr("aria-pressed", active ? "true" : "false");
  $btn.attr(
    "aria-label",
    active ? "Remove this city from favorites" : "Save this city to favorites",
  );
  $btn.toggleClass("border-amber-200/60 bg-amber-400/20 text-amber-50", active);
  $("#favorite-star-icon").toggleClass("brightness-0 invert", active);
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

  // 3. Format Sunrise and Sunset
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

  // show % and mm
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
    
    // Clear and re-trigger initial active styling border anchor 
    $(".day-card").css({ border: "1px solid #eee", "box-shadow": "none" });
    $(".day-card").first().css("border", "1px solid #333");
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
    refreshStarState();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load weather.";
    $status.removeClass("hidden").text(message);
    $("#hero-temp-main").text("—");
    $("#hero-temp-range").text("—");
    $("#hero-rain-value").text("—");
    $("#hero-snow-value").text("—");
    renderLocationSubtitle();
    refreshStarState();
  }
}

/**
 * @function hideSearchResults
 * @description Hides the search results list.
 * @returns {void}
 */
function hideSearchResults(): void {
  $("#search-results").empty().addClass("hidden");
}

/**
 * @function showSearchResults
 * @description Shows the search results in the search results list.
 * @param {LocationData[]} locations - The locations to show in the search results list.
 * @returns {void}
 */
function showSearchResults(locations: LocationData[]): void {
  const $list = $("#search-results");
  $list.empty();
  if (!locations.length) {
    $list.addClass("hidden");
    return;
  }
  for (const loc of locations) {
    const $item = $("<li>", { role: "presentation" });
    const $btn = $("<button>", {
      type: "button",
      class:
        "w-full px-4 py-2.5 text-left text-sm text-violet-950 hover:bg-violet-50 focus:bg-violet-50 focus:outline-none",
      role: "option",
    });
    const title = getCityDisplayName(loc);
    const subtitle = formatLocationSubtitle(loc);
    $("<span>", { class: "block font-medium", text: title }).appendTo($btn);
    if (subtitle) {
      $("<span>", {
        class: "block text-xs text-violet-500 mt-0.5",
        text: subtitle,
      }).appendTo($btn);
    }
    $btn.on("click", () => {
      selectedCity = locationFromPlaceKit(loc);
      $("#search-city-input").val("");
      hideSearchResults();
      void loadWeatherForSelected();
    });
    $item.append($btn);
    $list.append($item);
  }
  $list.removeClass("hidden");
}

/**
 * @function runPlaceSearch
 * @description Runs a place search using the PlaceKit API.
 * @param {string} query - The query to search for.
 * @returns {Promise<void>} A promise that resolves when the search is complete.
 */
async function runPlaceSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) {
    hideSearchResults();
    return;
  }
  try {
    const results = await searchPlaces(trimmed);
    showSearchResults(results);
  } catch {
    hideSearchResults();
  }
}

/**
 * @function bindFavoriteToggle
 * @description Binds a click event to the favorite toggle button to add or remove the current city from the favorites.
 * @returns {void}
 */
function bindFavoriteToggle(): void {
  $("#favorite-toggle").on("click", () => {
    const id = createFavoriteId(selectedCity.latitude, selectedCity.longitude);
    if (isFavorite(selectedCity.latitude, selectedCity.longitude)) {
      removeFavoriteById(id);
    } else {
      addFavorite({
        displayName: selectedCity.displayName,
        subtitle: selectedCity.subtitle || undefined,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      });
    }
    renderFavoriteDropdown();
    refreshStarState();
  });
}

/**
 * @function bindFavoriteSelect
 * @description Binds a change event to the favorite cities dropdown to load the weather for the selected city.
 * @returns {void}
 */
function bindFavoriteSelect(): void {
  $("#favorite-cities").on("change", function (this: HTMLSelectElement) {
    favoritesCache = loadFavorites();
    const id = String($(this).val());
    if (!id) return;
    const fav = favoritesCache.find((f) => f.id === id);
    $(this).val("");
    if (!fav) return;
    selectedCity = {
      displayName: fav.displayName,
      subtitle: fav.subtitle ?? "",
      latitude: fav.latitude,
      longitude: fav.longitude,
    };
    void loadWeatherForSelected();
  });
}

/**
 * @function bindSearchInput
 * @description Binds a input event to the search input to run a place search when the user types.
 * @returns {void}
 */
function bindSearchInput(): void {
  $("#search-city-input").on("input", function (this: HTMLInputElement) {
    const q = this.value;
    if (searchDebounceId) clearTimeout(searchDebounceId);
    searchDebounceId = setTimeout(() => {
      void runPlaceSearch(q);
    }, 350);
  });

  // Bind a keydown event to hide the search results when the user presses the Escape key.
  $("#search-city-input").on("keydown", (e) => {
    if (e.key === "Escape") hideSearchResults();
  });
}

/**
 * @function bindClickOutsideSearch
 * @description Binds a click event to hide the search results when clicking outside the search input.
 * @returns {void}
 */
function bindClickOutsideSearch(): void {
  $(document).on("click", (e) => {
    const target = e.target as Node;
    const $wrap = $("#search-city-input").parent();
    if (!$wrap.length) return;
    if (!$wrap[0]?.contains(target)) hideSearchResults();
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
 * @description Converts WMO interpretation codes into visual weather emojis
 */
export function getWeatherEmoji(code: number): string {
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

/**
 * Wire StrCats Weather UI to PlaceKit, Open-Meteo, and favorites (localStorage).
 * Call once on DOM ready (see index.astro).
 */
export async function initWeatherApp(): Promise<void> {
  await resolveInitialCity();
  renderFavoriteDropdown();
  refreshStarState();
  await loadWeatherForSelected();

  bindFavoriteToggle();
  bindFavoriteSelect();
  bindSearchInput();
  bindClickOutsideSearch();
}