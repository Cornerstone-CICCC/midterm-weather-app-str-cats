import { commonCountries } from "../constants/countries";
import type { LocationData } from "../types/location";

const PLACEKIT_API_URL = "https://api.placekit.co/search";

/**
 * @function searchPlaces
 * @param query - Input text value that the user types in the search field
 * @description This function gets the location results from the PlaceKit API based on the user's query.
 * @returns Array<LocationData[]> An array of location results matching the query, filtered by common countries and types
 */
export async function searchPlaces(query: string): Promise<LocationData[]> {
  const apiKey = import.meta.env.PUBLIC_PLACEKIT_API_KEY;

  // Make sure the API key is set
  if (!apiKey || String(apiKey).trim() === "") {
    throw new Error("Missing PUBLIC_PLACEKIT_API_KEY");
  }

  const response = await fetch(PLACEKIT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-placekit-api-key": String(apiKey),
    },
    body: JSON.stringify({
      query,
      countries: commonCountries,
      language: "en",
      types: ["street", "city"],
      maxResults: 5,
    }),
  });

  const data: { results?: LocationData[] } = await response.json();
  if (!response.ok) {
    throw new Error(`PlaceKit error (${response.status})`);
  }
  return data.results ?? [];
}
