import type {
  AdminDestinationDetail,
  AdminDestinationList,
  AttractionInput,
  CreateDestinationRequest,
  UpdateDestinationRequest,
} from "@arlink28/api-client";
import { apiFetch } from "./client";

const ADMIN = "/api/v1/admin/destinations";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** A photo and the words that go with it, as one multipart body. */
function photoForm(file: File, alt?: string, credit?: string): FormData {
  const form = new FormData();
  form.append("file", file);
  if (alt) form.append("alt", alt);
  if (credit) form.append("credit", credit);
  return form;
}

/** Staff destination management: every status, drafts included. */
export const adminDestinationsApi = {
  list: (
    query: { status?: string; search?: string; country?: string; kind?: string; page?: number; pageSize?: number } = {},
  ) => apiFetch<AdminDestinationList>(`${ADMIN}${toQuery(query)}`),

  get: (id: string) => apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}`),

  /** Rejects with an ApiError (409 CONFLICT) when the address is taken. */
  create: (body: CreateDestinationRequest) => apiFetch<AdminDestinationDetail>(ADMIN, json("POST", body)),

  update: (id: string, body: UpdateDestinationRequest) =>
    apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}`, json("PATCH", body)),

  /** Swaps the whole list. Send an attraction's id to keep its photo; list order is display order. */
  replaceAttractions: (id: string, attractions: AttractionInput[]) =>
    apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}/attractions`, json("PUT", attractions)),

  setHero: (id: string, file: File, alt?: string, credit?: string) =>
    apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}/hero`, { method: "POST", body: photoForm(file, alt, credit) }),

  setAttractionPhoto: (id: string, attractionId: string, file: File, alt?: string, credit?: string) =>
    apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}/attractions/${attractionId}/photo`, {
      method: "POST",
      body: photoForm(file, alt, credit),
    }),

  /** Rejects with an ApiError whose `missing` lists what the destination still needs. */
  publish: (id: string) => apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}/publish`, { method: "POST" }),
  unpublish: (id: string) => apiFetch<AdminDestinationDetail>(`${ADMIN}/${id}/unpublish`, { method: "POST" }),

  /** Rejects with a 409 while places, packages or properties still use it. */
  remove: (id: string) => apiFetch(`${ADMIN}/${id}`, { method: "DELETE" }),
};
