import type { DashboardResponse } from "@arlink28/api-client";
import { apiFetch } from "./client";

/** Staff: the numbers behind the overview, for the last `days` days (7 to 365). */
export const dashboardApi = {
  get: (days = 30) => apiFetch<DashboardResponse>(`/api/v1/admin/dashboard?days=${days}`),
};
