import type {
  AddOnInput,
  AdminPackageDetail,
  AdminReference,
  AdminPackageList,
  CreatePackageRequest,
  DestinationResponse,
  FeatureInput,
  PackageDetail,
  PackageList,
  PackageListQuery,
  PackageMedia,
  Quote,
  RateInput,
  StayInput,
  UpdateMediaRequest,
  UpdatePackageRequest,
} from "@arlink28/api-client";
import { apiFetch, parseResponse, returnToSignInIfExpired } from "./client";

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type QuoteInput = {
  checkIn: string;
  nights?: number;
  /** Add-on id to quantity; quantities below 1 are left out. */
  addOns?: Record<string, number>;
};

/** The public catalogue endpoints. They return published packages only. */
export const packagesApi = {
  list: (query: PackageListQuery = {}) => apiFetch<PackageList>(`/api/v1/packages${toQuery(query)}`),

  get: (slug: string) => apiFetch<PackageDetail>(`/api/v1/packages/${encodeURIComponent(slug)}`),

  quote: (slug: string, { checkIn, nights, addOns = {} }: QuoteInput) => {
    const picked = Object.entries(addOns)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");
    return apiFetch<Quote>(
      `/api/v1/packages/${encodeURIComponent(slug)}/quote${toQuery({ checkIn, nights, addOns: picked || undefined })}`,
    );
  },

  destinations: () => apiFetch<DestinationResponse[]>("/api/v1/destinations"),
};

const ADMIN = "/api/v1/admin/packages";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Staff package management: every status, drafts included. */
export const adminPackagesApi = {
  list: (
    query: {
      status?: string;
      search?: string;
      destination?: string;
      category?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => apiFetch<AdminPackageList>(`${ADMIN}${toQuery(query)}`),

  get: (id: string) => apiFetch<AdminPackageDetail>(`${ADMIN}/${id}`),

  /** Properties, seasons and features the form picks from. */
  reference: () => apiFetch<AdminReference>("/api/v1/admin/reference"),

  // Each of these swaps the package's whole list, as the form saves it.
  replaceStays: (id: string, stays: StayInput[]) =>
    apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/stays`, json("PUT", stays)),
  replaceFeatures: (id: string, features: FeatureInput[]) =>
    apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/features`, json("PUT", features)),
  replaceRates: (id: string, rates: RateInput[]) =>
    apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/rates`, json("PUT", rates)),
  replaceAddOns: (id: string, addOns: AddOnInput[]) =>
    apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/add-ons`, json("PUT", addOns)),

  /** Rejects with an ApiError whose `missing` lists what the package still needs. */
  publish: (id: string) => apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/publish`, { method: "POST" }),
  unpublish: (id: string) => apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/unpublish`, { method: "POST" }),
  archive: (id: string) => apiFetch<AdminPackageDetail>(`${ADMIN}/${id}/archive`, { method: "POST" }),

  create: (body: CreatePackageRequest) => apiFetch<AdminPackageDetail>(ADMIN, json("POST", body)),

  update: (id: string, body: UpdatePackageRequest) =>
    apiFetch<AdminPackageDetail>(`${ADMIN}/${id}`, json("PATCH", body)),

  updateMedia: (id: string, mediaId: string, body: UpdateMediaRequest) =>
    apiFetch<PackageMedia>(`${ADMIN}/${id}/media/${mediaId}`, json("PATCH", body)),

  reorderMedia: (id: string, ids: string[]) =>
    apiFetch<PackageMedia[]>(`${ADMIN}/${id}/media/order`, json("PUT", { ids })),

  deleteMedia: (id: string, mediaId: string) => apiFetch(`${ADMIN}/${id}/media/${mediaId}`, { method: "DELETE" }),

  /**
   * Uploads photos in one request. Uses XMLHttpRequest because fetch can't report
   * upload progress, and progress is what makes a slow connection bearable.
   * All-or-nothing: the API saves none of them if any file is rejected.
   */
  uploadPhotos: (id: string, files: File[], onProgress?: (fraction: number) => void) =>
    new Promise<PackageMedia[]>((resolve, reject) => {
      const path = `${ADMIN}/${id}/media`;
      const form = new FormData();
      for (const file of files) form.append("files", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", path);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
      xhr.onload = () => {
        returnToSignInIfExpired(xhr.status, path);
        parseResponse<PackageMedia[]>(new Response(xhr.responseText || null, { status: xhr.status })).then(
          resolve,
          reject,
        );
      };
      xhr.send(form);
    }),
};
