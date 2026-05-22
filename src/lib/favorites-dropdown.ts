import $ from "jquery";
import {
  addFavorite,
  createFavoriteId,
  isFavorite,
  loadFavorites,
  removeFavoriteById,
} from "./favorites";
import { showDropdownList } from "./search-list";

export type FavoriteCitySelection = {
  displayName: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

let getSelectedCity: () => FavoriteCitySelection = () => ({
  displayName: "",
  subtitle: "",
  latitude: 0,
  longitude: 0,
});
let onCitySelected: (city: FavoriteCitySelection) => void = () => {};

export function hideFavoriteList(): void {
  $("#favorite-cities-list").addClass("hidden");
  $("#favorite-cities-trigger").attr("aria-expanded", "false");
}

function showFavoriteList(): void {
  $("#favorite-cities-list").removeClass("hidden");
  $("#favorite-cities-trigger").attr("aria-expanded", "true");
}

export function renderFavoriteDropdown(): void {
  const $list = $("#favorite-cities-list");
  $list.empty();
  hideFavoriteList();

  const favorites = loadFavorites();
  if (!favorites.length) {
    $list.append(
      $("<li>", {
        class: "px-4 py-2 text-sm text-slate-500",
        text: "No favorites yet",
      }),
    );
    return;
  }

  const items = favorites.map((fav) => ({
    title: fav.displayName,
    subtitle: fav.subtitle,
    onSelect: () => {
      hideFavoriteList();
      onCitySelected({
        displayName: fav.displayName,
        subtitle: fav.subtitle ?? "",
        latitude: fav.latitude,
        longitude: fav.longitude,
      });
    },
  }));
  showDropdownList($list, items);
  hideFavoriteList();
}

export function refreshFavoriteStar(): void {
  const city = getSelectedCity();
  const active = isFavorite(city.latitude, city.longitude);
  const $btn = $("#favorite-toggle");
  $btn.attr("aria-pressed", active ? "true" : "false");
  $btn.attr(
    "aria-label",
    active ? "Remove this city from favorites" : "Save this city to favorites",
  );
  if (active) {
    $("#fav-icon-default").addClass("hidden");
    $("#fav-icon-active").removeClass("hidden");
  } else {
    $("#fav-icon-active").addClass("hidden");
    $("#fav-icon-default").removeClass("hidden");
  }
}

function bindFavoriteToggle(): void {
  $("#favorite-toggle").on("click", () => {
    const city = getSelectedCity();
    const id = createFavoriteId(city.latitude, city.longitude);
    if (isFavorite(city.latitude, city.longitude)) {
      removeFavoriteById(id);
    } else {
      addFavorite({
        displayName: city.displayName,
        subtitle: city.subtitle || undefined,
        latitude: city.latitude,
        longitude: city.longitude,
      });
    }
    renderFavoriteDropdown();
    refreshFavoriteStar();
  });
}

function bindFavoriteDropdown(): void {
  $("#favorite-cities-trigger").on("click", () => {
    const $list = $("#favorite-cities-list");
    if ($list.hasClass("hidden")) showFavoriteList();
    else hideFavoriteList();
  });

  $("#favorite-cities-trigger").on("keydown", (e) => {
    if (e.key === "Escape") hideFavoriteList();
  });
}

export function bindFavorites(handlers: {
  getSelectedCity: () => FavoriteCitySelection;
  onCitySelected: (city: FavoriteCitySelection) => void;
}): void {
  getSelectedCity = handlers.getSelectedCity;
  onCitySelected = handlers.onCitySelected;
  bindFavoriteToggle();
  bindFavoriteDropdown();
}
