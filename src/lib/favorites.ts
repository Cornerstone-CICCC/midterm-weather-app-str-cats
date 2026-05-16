import type { FavoriteCity } from "../types/favorite-city";

const FAVORITES_STORAGE_KEY = "strcats-weather-favorites";

export function createFavoriteId(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}|${longitude.toFixed(5)}`;
}

/**
 * @function parseFavorites
 * @description Parses/converts the favorites from the localStorage to an array of FavoriteCity objects.
 * @param {string | null} raw - The raw string from the localStorage.
 * @returns {FavoriteCity[]} An array of favorite cities.
 */
function parseFavorites(raw: string | null): FavoriteCity[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavoriteCity);
  } catch {
    return [];
  }
}

/**
 * @function isFavoriteCity
 * @description Checks if the value is a valid FavoriteCity object.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a valid FavoriteCity object, false otherwise.
 */
function isFavoriteCity(value: unknown): value is FavoriteCity {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.displayName === "string" &&
    typeof v.latitude === "number" &&
    typeof v.longitude === "number"
  );
}

/**
 * @function loadFavorites
 * @description Loads the favorites from the localStorage.
 * @returns {FavoriteCity[]} An array of favorite cities.
 */
export function loadFavorites(): FavoriteCity[] {
  if (typeof window === "undefined") return [];
  return parseFavorites(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
}

/**
 * @function saveFavorites
 * @description Saves the favorites to the localStorage.
 * @param {FavoriteCity[]} favorites - The array of favorite cities to save.
 */
export function saveFavorites(favorites: FavoriteCity[]): void {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

/**
 * @function addFavorite
 * @description Adds a new favorite city to the localStorage.
 * @param {Omit<FavoriteCity, "id"> & { id?: string }} city - The city to add.
 * @returns {void}
 */
export function addFavorite(
  city: Omit<FavoriteCity, "id"> & { id?: string },
): void {
  const id = city.id ?? createFavoriteId(city.latitude, city.longitude);
  const next: FavoriteCity = {
    id,
    displayName: city.displayName,
    latitude: city.latitude,
    longitude: city.longitude,
  };
  const existing = loadFavorites().filter((f) => f.id !== next.id);
  saveFavorites([next, ...existing]);
}

/**
 * @function removeFavoriteById
 * @description Removes a favorite city from the localStorage by its ID.
 * @param {string} id - The ID of the city to remove.
 * @returns {void}
 */
export function removeFavoriteById(id: string): void {
  saveFavorites(loadFavorites().filter((f) => f.id !== id));
}

/**
 * @function isFavorite
 * @description Checks if a city is a favorite by its latitude and longitude.
 * @param {number} latitude - The latitude of the city.
 * @param {number} longitude - The longitude of the city.
 * @returns {boolean} True if the city is a favorite, false otherwise.
 */
export function isFavorite(latitude: number, longitude: number): boolean {
  const id = createFavoriteId(latitude, longitude);
  return loadFavorites().some((f) => f.id === id);
}
