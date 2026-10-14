import "../styles/home.css";
import ErrorPanel from "@/components/home/ErrorPanel";

export const metadata = { title: "Page not found | ARLink28", robots: { index: false } };

export default function NotFound() {
  return <ErrorPanel kind="notfound" />;
}
