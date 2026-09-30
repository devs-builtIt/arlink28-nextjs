import type { EnquiryListItem, EnquiryStatus, EnquiryType } from "@arlink28/api-client";
import { Badge } from "@/components/admin/ui";
import { money } from "@/components/admin/format";

export const STATUSES: EnquiryStatus[] = ["New", "Contacted", "Closed"];

const STATUS_TONE = { New: "warning", Contacted: "success", Closed: "neutral" } as const;

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}

const TYPE_LABEL: Record<EnquiryType, string> = {
  Package: "Package enquiry",
  General: "General message",
  Booking: "Booking help",
  Partnership: "Partnership",
  Career: "Career",
  Investor: "Investor",
};
export const typeLabel = (type: EnquiryType) => TYPE_LABEL[type] ?? type;

/** "12 Jan 2027" from an API date (yyyy-mm-dd), without the time zone moving it a day. */
export function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The trip a package enquiry asks about: "12 Jan 2027, 2 nights, US$7,472". */
export function tripLine(
  e: Pick<EnquiryListItem, "checkIn" | "nights" | "quotedTotalMinor" | "currency">,
): string | null {
  const parts: string[] = [];
  if (e.checkIn) parts.push(dayLabel(e.checkIn));
  if (e.nights) parts.push(`${e.nights} ${e.nights === 1 ? "night" : "nights"}`);
  if (e.quotedTotalMinor != null && e.currency) parts.push(money(e.quotedTotalMinor, e.currency));
  return parts.length > 0 ? parts.join(", ") : null;
}
