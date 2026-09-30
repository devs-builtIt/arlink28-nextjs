// Shared by the contact page (server) and its form (client). Kept out of the "use client" file,
// because a server component gets a reference, not the value, when it imports from one.

export type EnquiryPackage = {
  slug: string;
  title: string;
  /** HolidayPackage, Flight, HotelReservation or VisaSupport. Only holidays have nights, a party and a quote. */
  kind: string;
  /** Where the listing lives on the site. */
  path: string;
  /** For the other kinds: the route, the room or the country, in a line. */
  summary: string;
  nights: number;
  adults: number;
  children: number;
  extraNightsSold: boolean;
};

export type GeneralType = "General" | "Booking" | "Partnership" | "Career" | "Investor";

export const GENERAL_TYPES: { value: GeneralType; label: string }[] = [
  { value: "General", label: "General" },
  { value: "Booking", label: "Booking help" },
  { value: "Partnership", label: "Partnership" },
  { value: "Career", label: "Career" },
  { value: "Investor", label: "Investor" },
];
