import $ from "jquery";
import { createFavoriteId } from "./favorites";
import { hideSearchResults, showSearchList } from "./search-list";

const RECENT_SEARCHES_STORAGE_KEY = "strcats-weather-recent-searches";
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCH_ICON_SRC = "/assets/icon-history.png";

import { getContext } from "./init-weather-app"


export type RecentSearch = {
  id: string;
  displayName: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
};

export type RecentSearchCity = {
  displayName: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

/** Parse the recent searches from the local storage. */
function parseRecentSearches(raw: string | null): RecentSearch[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearch);
  } catch {
    return [];
  }
}

/** Check if the given value is a recent search. Used for filtering the recent searches. */
function isRecentSearch(value: unknown): value is RecentSearch {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.displayName === "string" &&
    typeof v.latitude === "number" &&
    typeof v.longitude === "number"
  );
}

/** Load the recent searches from the local storage. */
export function loadRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  return parseRecentSearches(
    window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY),
  );
}

/** Save the recent searches to the local storage. */
function saveRecentSearches(searches: RecentSearch[]): void {
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(searches),
  );
}

/** Add a new recent search to the the storage. */
export function addRecentSearch(
  city: Omit<RecentSearch, "id"> & { id?: string },
): void {
  const id = city.id ?? createFavoriteId(city.latitude, city.longitude);
  const next: RecentSearch = {
    id,
    displayName: city.displayName,
    subtitle: city.subtitle,
    latitude: city.latitude,
    longitude: city.longitude,
  };
  const existing = loadRecentSearches().filter((s) => s.id !== next.id);
  saveRecentSearches([next, ...existing].slice(0, MAX_RECENT_SEARCHES));
}

/** Record a recent search from a city. */
export function recordRecentFromCity(city: RecentSearchCity): void {
  addRecentSearch({
    displayName: city.displayName,
    subtitle: city.subtitle || undefined,
    latitude: city.latitude,
    longitude: city.longitude,
  });
}

/** Check if the search input is empty and focused.
 * Used to determine if the recent searches should be shown.
 */
export function isSearchInputEmptyAndFocused(): boolean {
  const $context = getContext();
  const input = $("#search-city-input", $context)[0] as HTMLInputElement | undefined;
  return Boolean(input?.matches(":focus") && !input.value.trim());
}

/** Show the recent searches in the search bar. */
export function showRecentSearches(
  onSelect: (city: RecentSearchCity) => void,
): void {
  const items = loadRecentSearches().map((entry) => ({
    title: entry.displayName,
    subtitle: entry.subtitle,
    iconSrc: RECENT_SEARCH_ICON_SRC,
    onSelect: () => {
      const city: RecentSearchCity = {
        displayName: entry.displayName,
        subtitle: entry.subtitle ?? "",
        latitude: entry.latitude,
        longitude: entry.longitude,
      };
      recordRecentFromCity(city);
      $("#search-city-input", getContext()).val("");
      hideSearchResults();
      onSelect(city);
    },
  }));
  showSearchList(items);
}

/** Show the recent searches if the search input is empty and focused. */
export function showRecentSearchesIfApplicable(
  onSelect: (city: RecentSearchCity) => void,
): void {
  if (isSearchInputEmptyAndFocused()) showRecentSearches(onSelect);
  else hideSearchResults();
}
