import type { HeroSlide } from "@/components/home/HeroSlides";

/**
 * The home hero slideshow. TRIAL: these photos were supplied for a layout test. Confirm the business holds the rights
 * to each (they look like lodge or operator photography) before launch, and credit them in public/images/home/CREDITS.md.
 *
 * Each picture is exported at its own native width as well as smaller ones, never stretched. The Namibia photo is only
 * 1920 px wide, so on very wide or high-density screens it will look softer than the other two: ask for a larger original.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    region: "Africa",
    place: "Serengeti",
    blurb: "Lantern-lit tented camps under a wide East African sky.",
    sizes: [
      { src: "/images/home/slide-serengeti-1280.webp", w: 1280 },
      { src: "/images/home/slide-serengeti-1920.webp", w: 1920 },
      { src: "/images/home/slide-serengeti-2453.webp", w: 2453 },
    ],
    thumb: "/images/home/slide-serengeti-thumb.webp",
    focus: "50% 72%", // the tree and the tents sit low in the frame
  },
  {
    region: "Africa",
    place: "Namibia",
    blurb: "Desert silence and sunset colour from a private terrace.",
    sizes: [
      { src: "/images/home/slide-namibia-1280.webp", w: 1280 },
      { src: "/images/home/slide-namibia-1920.webp", w: 1920 },
    ],
    thumb: "/images/home/slide-namibia-thumb.webp",
    focus: "50% 60%",
  },
  {
    region: "Africa",
    place: "Knysna",
    blurb: "Clear blue water and green headlands on South Africa's coast.",
    sizes: [
      { src: "/images/home/slide-knysna-1280.webp", w: 1280 },
      { src: "/images/home/slide-knysna-1920.webp", w: 1920 },
      { src: "/images/home/slide-knysna-2048.webp", w: 2048 },
    ],
    thumb: "/images/home/slide-knysna-thumb.webp",
    focus: "50% 45%", // keep the bay in view above the stairs
  },
];
