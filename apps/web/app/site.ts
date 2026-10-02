import type { Metadata } from "next";

/** Site-wide defaults. Pages override the title and description. */
export const siteMetadata: Metadata = {
  metadataBase: new URL("https://arlink28.com"),
  title: "ARLink28 | Travel across Africa and beyond",
  description:
    "Flights, hotel reservations, visa support and holidays across Africa and beyond, arranged by people who know the routes.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};
