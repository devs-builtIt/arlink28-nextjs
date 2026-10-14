// The guides planned for the blog. There are no published posts yet, so these are shown as "Coming soon" on the
// homepage and on the blog page. Replace an entry with a real link when its post is written.

export type BlogTeaser = { title: string; image: string; alt: string };

export const BLOG_TEASERS: BlogTeaser[] = [
  {
    title: "Lagos to London: what to know before you fly",
    image: "/images/home/route-lhr.webp",
    alt: "Big Ben and the London Eye under a blue sky",
  },
  {
    title: "Dubai from Abuja: a plain checklist for visas and flights",
    image: "/images/home/route-dxb.webp",
    alt: "The Dubai skyline at sunset, with the Burj Khalifa",
  },
  {
    title: "Zanzibar for first-timers: when to go and where to stay",
    image: "/images/home/hero-zanzibar-900.webp",
    alt: "A sandbar surrounded by turquoise water in Zanzibar",
  },
];
