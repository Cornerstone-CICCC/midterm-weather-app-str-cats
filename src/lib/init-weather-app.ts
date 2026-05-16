import $ from "jquery";

import {
  addFavorite,
  createFavoriteId,
  isFavorite,
  loadFavorites,
  removeFavoriteById,
} from "./favorites";
import { getGeolocation } from "./geolocation";
import { searchPlaces } from "./placekit";
import {
  FALLBACK_CITY,
  GEO_LOCATION_LABEL,
  getTodayMinMax,
} from "./weather-display";
import { getWeatherInfo } from "./weather";
import type { FavoriteCity } from "../types/favorite-city";
import type { LocationData } from "../types/location";
import type { WeatherData } from "../types/weather";

type SelectedCity = {
  displayName: string;
  latitude: number;
  longitude: number;
};

let selectedCity: SelectedCity = { ...FALLBACK_CITY };
let favoritesCache: FavoriteCity[] = loadFavorites();
let searchDebounceId: ReturnType<typeof setTimeout> | undefined;

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
  for (const f of favoritesCache) {
    $("<option>", { value: f.id, text: f.displayName }).appendTo($sel);
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
 * @param {string} cityLabel - The label of the city to render.
 * @returns {void}
 */
function renderWeatherCard(weather: WeatherData, cityLabel: string): void {
  $("#hero-city-name").text(cityLabel);

  const unit = weather.current_units.temperature_2m;
  $("#hero-temp-main").text(`${weather.current.temperature_2m}${unit}`);

  const range = getTodayMinMax(weather);
  if (range) {
    $("#hero-temp-range").text(`${range.min}${unit} – ${range.max}${unit}`);
  } else {
    $("#hero-temp-range").text("—");
  }

  const rain0 = weather.hourly.rain[0];
  const snow0 = weather.hourly.snowfall[0];
  $("#hero-rain-value").text(`${rain0} ${weather.hourly_units.rain}`);
  $("#hero-snow-value").text(`${snow0} ${weather.hourly_units.snowfall}`);

  $("#hero-status").addClass("hidden").text("");
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
    renderWeatherCard(weather, selectedCity.displayName);
    refreshStarState();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load weather.";
    $status.removeClass("hidden").text(message);
    $("#hero-temp-main").text("—");
    $("#hero-temp-range").text("—");
    $("#hero-rain-value").text("—");
    $("#hero-snow-value").text("—");
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
    $btn.text(loc.name);
    $btn.on("click", () => {
      selectedCity = {
        displayName: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
      };
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
