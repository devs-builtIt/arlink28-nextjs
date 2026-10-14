"use client";

import ProtectedPage from "@/components/ProtectedPage";
import Dashboard from "@/components/admin/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedPage wide>
      <Dashboard />
    </ProtectedPage>
  );
}
