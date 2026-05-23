import $ from "jquery";

export const SEARCH_RESULT_OPTION_CLASS =
  "w-full px-4 py-2.5 text-left text-sm text-slate-950 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none";
export const SEARCH_RESULT_SUBTITLE_CLASS =
  "block text-xs text-slate-500 mt-0.5";

export function hideSearchResults(): void {
  $("#search-results").empty().addClass("hidden");
}

export type SearchListItem = {
  title: string;
  subtitle?: string;
  iconSrc?: string;
  onSelect: () => void;
};

/** Append a search list option to the given list. */
export function appendSearchListOption(
  $list: JQuery<HTMLElement>,
  item: SearchListItem,
): void {
  const { title, subtitle, iconSrc, onSelect } = item;
  const $item = $("<li>", { role: "presentation" });
  const $btn = $("<button>", {
    type: "button",
    class: iconSrc
      ? `${SEARCH_RESULT_OPTION_CLASS} flex items-start gap-3`
      : SEARCH_RESULT_OPTION_CLASS,
    role: "option",
  });

  const $textWrap = $("<span>", {
    class: iconSrc ? "min-w-0 flex-1" : undefined,
  });
  if (iconSrc) {
    $("<img>", {
      src: iconSrc,
      alt: "",
      width: 20,
      height: 20,
      class: "mt-2 h-4 w-5 shrink-0 object-contain opacity-40",
    }).appendTo($btn);
  }
  $("<span>", { class: "block font-medium", text: title }).appendTo(
    iconSrc ? $textWrap : $btn,
  );
  if (subtitle) {
    $("<span>", {
      class: SEARCH_RESULT_SUBTITLE_CLASS,
      text: subtitle,
    }).appendTo(iconSrc ? $textWrap : $btn);
  }
  if (iconSrc) $textWrap.appendTo($btn);

  $btn.on("click", onSelect);
  $item.append($btn);
  $list.append($item);
}

/** Show the search list with the given items. */
export function showSearchList(items: SearchListItem[]): void {
  const $list = $("#search-results");
  $list.empty();
  if (!items.length) {
    $list.addClass("hidden");
    return;
  }
  for (const item of items) {
    appendSearchListOption($list, item);
  }
  $list.removeClass("hidden");
}
