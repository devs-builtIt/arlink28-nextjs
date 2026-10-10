import { notFound } from "next/navigation";

// Any address that matches no page lands here and is sent to the 404 page of this layout group, so it keeps the
// site's header, footer and styles. (A not-found file at the very root has no layout around it.)
export default function Missing() {
  notFound();
}
