// The public catalogue, read on the server. Pages call these directly, so they arrive as
// finished HTML (good for search engines and for link previews) and are cached briefly.
import type { DestinationDetail, DestinationResponse, PackageDetail, PackageList } from "@arlink28/api-client";
import { unwrapLegacyEnvelope } from "@/utils/api/client";
import { apiUrl } from "@/utils/server/api";

export const PAGE_SIZE = 12;

export type ListQuery = {
  destination?: string;
  category?: string;
  /** HolidayPackage (the API's default), Flight, HotelReservation or VisaSupport. */
  type?: string;
  partner?: string;
  adults?: number;
  sort?: string;
  q?: string;
  page?: number;
  /** Packages per page. Defaults to PAGE_SIZE. */
  size?: number;
};

async function get<T>(path: string, revalidate: number): Promise<T | null> {
  const res = await fetch(`${apiUrl()}/api/v1${path}`, { next: { revalidate } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`The catalogue answered ${res.status}.`);
  return unwrapLegacyEnvelope<T>(await res.json());
}

export async function listPackages(query: ListQuery): Promise<PackageList> {
  const { size = PAGE_SIZE, ...filters } = query;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  params.set("limit", String(size));
  params.set("page", String(query.page ?? 1));
  return (await get<PackageList>(`/packages?${params}`, 60))!;
}

export const getPackage = (slug: string) => get<PackageDetail>(`/packages/${encodeURIComponent(slug)}`, 60);

export async function listDestinations(): Promise<DestinationResponse[]> {
  return (await get<DestinationResponse[]>("/destinations", 300)) ?? [];
}

/** A published destination with its attractions and places, or null when it does not exist (or is still a draft). */
export const getDestination = (slug: string) =>
  get<DestinationDetail>(`/destinations/${encodeURIComponent(slug)}`, 60);
