import type { GeolocationData } from "../types/location";

/**
 * @function getGeolocation
 * @description This function attempts to get the user's current geolocation using the browser's Geolocation API.
 * If successful, it resolves with an object containing the latitude and longitude.
 * If geolocation is not supported or if there is an error (e.g., user denies permission), it rejects with an error.
 */
export function getGeolocation(): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
        });
      },
      (error: GeolocationPositionError) => reject(error),
      { timeout: 10000 },
    );
  });
}
