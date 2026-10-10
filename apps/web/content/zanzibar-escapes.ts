// The Zanzibar escapes offered with Blue Ocean, shown under the partner cards on each booking page. Prices and
// inclusions are Blue Ocean's; they are shown as given on the package flyers.

export type ZanzibarEscape = { img: string; title: string; meta: string; price: string };

const e = (file: string, title: string, meta: string, price: string): ZanzibarEscape => ({
  img: `/images/packages/${file}.jpg`,
  title,
  meta,
  price,
});

export const ZANZIBAR_ESCAPES: ZanzibarEscape[] = [
  e("zanzibar-escape", "Zanzibar Escape", "4 nights · 2 adults", "$649"),
  e("zanzibar-mini-escape", "Zanzibar Mini Escape", "3 nights · 2 adults", "$449"),
  e("zanzibar-family-friends-escape", "Zanzibar Family & Friends Escape", "5 nights · 4 adults", "$1,499"),
  e("zanzibar-group-escape", "Zanzibar Group Escape", "4 nights · 6 adults", "$1,399"),
  e("zanzibar-royal-escape", "Zanzibar Royal Escape", "4 nights · 6 adults", "$3,099"),
  e("zanzibar-solo-escape", "Zanzibar Solo Escape", "3 nights · 1 adult", "$369"),
  e("zanzibar-solo-sea-view-escape", "Zanzibar Solo Sea View Escape", "3 nights · 1 adult", "$429"),
  e("zanzibar-solo-extended-escape", "Zanzibar Solo Extended Escape", "4 nights · 1 adult", "$469"),
];
