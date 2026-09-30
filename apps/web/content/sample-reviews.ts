// PLACEHOLDER reviews, shown on package pages until there are real guest reviews.
//
// They are labelled "Sample reviews" on the page and are left out of the page's structured data,
// so search engines never see them as ratings. To go live: replace REVIEWS and SUMMARY with real
// ones and set SAMPLE to false. The label goes away by itself.

export const SAMPLE = true;

export type Review = { name: string; when: string; score: number; title: string; text: string };

export const SUMMARY = {
  score: 4.8,
  count: 42,
  breakdown: [
    { label: "Service", score: 4.9 },
    { label: "Value for money", score: 4.7 },
    { label: "Accommodation", score: 4.9 },
    { label: "Organisation", score: 4.8 },
  ],
};

export const REVIEWS: Review[] = [
  {
    name: "Guest",
    when: "March 2026",
    score: 5,
    title: "Everything was arranged before we arrived",
    text: "The price we were quoted was the price we paid, and the itinerary matched what we had read. Nothing to chase.",
  },
  {
    name: "Guest",
    when: "February 2026",
    score: 5,
    title: "Clear about what was included",
    text: "We knew what was covered and what was not, so there were no surprises at the end of the stay.",
  },
  {
    name: "Guest",
    when: "January 2026",
    score: 4,
    title: "Good value for the whole package",
    text: "Having the stay, the meals and the transfers in one price made it easy to plan and to compare.",
  },
];
