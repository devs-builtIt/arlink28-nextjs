import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// One plain, highly legible UI face for everything (headings, tables, forms).
const ui = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: "ARLink28 staff admin",
  description: "Sign in to manage ARLink28 staff accounts.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Everything admin is scoped under .adm, so it can't clash with the public
  // site's global CSS if both are loaded in one session.
  return (
    <AuthProvider>
      <div className={`adm ${ui.variable}`}>{children}</div>
    </AuthProvider>
  );
}
