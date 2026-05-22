import $ from "jquery";

export const SEARCH_RESULT_OPTION_CLASS =
  "w-full px-4 py-2.5 text-left text-sm text-slate-950 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none";
export const SEARCH_RESULT_SUBTITLE_CLASS =
  "block text-xs text-slate-500 mt-0.5";

export function hideSearchResults(): void {
  $("#search-results").empty().addClass("hidden");
}

export function appendSearchListOption(
  $list: JQuery<HTMLElement>,
  title: string,
  subtitle: string | undefined,
  onSelect: () => void,
): void {
  const $item = $("<li>", { role: "presentation" });
  const $btn = $("<button>", {
    type: "button",
    class: SEARCH_RESULT_OPTION_CLASS,
    role: "option",
  });
  $("<span>", { class: "block font-medium", text: title }).appendTo($btn);
  if (subtitle) {
    $("<span>", {
      class: SEARCH_RESULT_SUBTITLE_CLASS,
      text: subtitle,
    }).appendTo($btn);
  }
  $btn.on("click", onSelect);
  $item.append($btn);
  $list.append($item);
}

export function showSearchList(
  items: { title: string; subtitle?: string; onSelect: () => void }[],
): void {
  const $list = $("#search-results");
  $list.empty();
  if (!items.length) {
    $list.addClass("hidden");
    return;
  }
  for (const item of items) {
    appendSearchListOption($list, item.title, item.subtitle, item.onSelect);
  }
  $list.removeClass("hidden");
}
