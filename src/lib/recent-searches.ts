import $ from "jquery";
import { createFavoriteId } from "./favorites";
import { hideSearchResults, showSearchList } from "./search-list";

const RECENT_SEARCHES_STORAGE_KEY = "strcats-weather-recent-searches";
const MAX_RECENT_SEARCHES = 5;

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

export function loadRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  return parseRecentSearches(
    window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY),
  );
}

function saveRecentSearches(searches: RecentSearch[]): void {
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(searches),
  );
}

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

export function recordRecentFromCity(city: RecentSearchCity): void {
  addRecentSearch({
    displayName: city.displayName,
    subtitle: city.subtitle || undefined,
    latitude: city.latitude,
    longitude: city.longitude,
  });
}

export function isSearchInputEmptyAndFocused(): boolean {
  const input = $("#search-city-input")[0] as HTMLInputElement | undefined;
  return Boolean(input?.matches(":focus") && !input.value.trim());
}

export function showRecentSearches(
  onSelect: (city: RecentSearchCity) => void,
): void {
  const items = loadRecentSearches().map((entry) => ({
    title: entry.displayName,
    subtitle: entry.subtitle,
    onSelect: () => {
      const city: RecentSearchCity = {
        displayName: entry.displayName,
        subtitle: entry.subtitle ?? "",
        latitude: entry.latitude,
        longitude: entry.longitude,
      };
      recordRecentFromCity(city);
      $("#search-city-input").val("");
      hideSearchResults();
      onSelect(city);
    },
  }));
  showSearchList(items);
}

export function showRecentSearchesIfApplicable(
  onSelect: (city: RecentSearchCity) => void,
): void {
  if (isSearchInputEmptyAndFocused()) showRecentSearches(onSelect);
  else hideSearchResults();
}
