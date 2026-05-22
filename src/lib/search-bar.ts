import $ from "jquery";
import {
  formatLocationSubtitle,
  getCityDisplayName,
  locationFromPlaceKit,
} from "./location-format";
import { searchPlaces } from "./placekit";
import {
  isSearchInputEmptyAndFocused,
  recordRecentFromCity,
  showRecentSearches,
  showRecentSearchesIfApplicable,
  type RecentSearchCity,
} from "./recent-searches";
import { hideSearchResults, showSearchList } from "./search-list";
import type { LocationData } from "../types/location";

export type { RecentSearchCity };
export { hideSearchResults };

let searchDebounceId: ReturnType<typeof setTimeout> | undefined;
let onCitySelected: (city: RecentSearchCity) => void = () => {};

function selectSearchCity(city: RecentSearchCity): void {
  recordRecentFromCity(city);
  $("#search-city-input").val("");
  hideSearchResults();
  onCitySelected(city);
}

function showPlaceSearchResults(locations: LocationData[]): void {
  const items = locations.map((loc) => {
    const title = getCityDisplayName(loc);
    const subtitle = formatLocationSubtitle(loc);
    return {
      title,
      subtitle,
      onSelect: () => selectSearchCity(locationFromPlaceKit(loc)),
    };
  });
  showSearchList(items);
}

export async function runPlaceSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) {
    showRecentSearchesIfApplicable(onCitySelected);
    return;
  }
  try {
    const results = await searchPlaces(trimmed);
    showPlaceSearchResults(results);
  } catch {
    hideSearchResults();
  }
}

export function bindSearchBar(handlers: {
  onCitySelected: (city: RecentSearchCity) => void;
}): void {
  onCitySelected = handlers.onCitySelected;

  $("#search-city-input").on("focus", function (this: HTMLInputElement) {
    if (!this.value.trim()) showRecentSearches(onCitySelected);
  });

  $("#search-city-input").on("input", function (this: HTMLInputElement) {
    const q = this.value;
    if (searchDebounceId) clearTimeout(searchDebounceId);
    if (!q.trim()) {
      if (isSearchInputEmptyAndFocused()) showRecentSearches(onCitySelected);
      else hideSearchResults();
      return;
    }
    searchDebounceId = setTimeout(() => {
      void runPlaceSearch(q);
    }, 350);
  });

  $("#search-city-input").on("keydown", (e) => {
    if (e.key === "Escape") hideSearchResults();
  });
}
