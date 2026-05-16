import { commonCountries } from "../constants/countries";
import type { LocationData } from "../types/location";

const PLACEKIT_API_URL = "https://api.placekit.co/search";

function getPlaceKitApiKey(): string {
  const apiKey = import.meta.env.PUBLIC_PLACEKIT_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    throw new Error("Missing PUBLIC_PLACEKIT_API_KEY");
  }
  return String(apiKey);
}

/**
 * City suggestions from PlaceKit
 */
export async function searchPlaces(query: string): Promise<LocationData[]> {
  const response = await fetch(PLACEKIT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-placekit-api-key": getPlaceKitApiKey(),
    },
    body: JSON.stringify({
      query,
      countries: commonCountries,
      language: "en",
      types: ["city"],
      maxResults: 5,
    }),
  });

  const data: { results?: LocationData[] } = await response.json();
  if (!response.ok) {
    throw new Error(`PlaceKit error (${response.status})`);
  }
  return data.results ?? [];
}
