import type {
  CreateEnquiryRequest,
  CreateEnquiryResponse,
  EnquiryDetail,
  EnquiryList,
  EnquiryStatus,
} from "@arlink28/api-client";
import { apiFetch } from "./client";

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** The public contact form. Rejects with an ApiError: fieldErrors on 400, code RATE_LIMITED on 429. */
export const enquiriesApi = {
  create: (body: CreateEnquiryRequest) => apiFetch<CreateEnquiryResponse>("/api/v1/enquiries", json("POST", body)),
};

const ADMIN = "/api/v1/admin/enquiries";

/** Staff: read enquiries and mark how far each has got. */
export const adminEnquiriesApi = {
  list: (query: { status?: EnquiryStatus; page?: number; pageSize?: number } = {}) => {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) q.set(key, String(value));
    }
    const s = q.toString();
    return apiFetch<EnquiryList>(s ? `${ADMIN}?${s}` : ADMIN);
  },

  get: (id: string) => apiFetch<EnquiryDetail>(`${ADMIN}/${id}`),

  setStatus: (id: string, status: EnquiryStatus) =>
    apiFetch<EnquiryDetail>(`${ADMIN}/${id}`, json("PATCH", { status })),
};
