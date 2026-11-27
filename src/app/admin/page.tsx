import type { Metadata } from "next";
import { AdminListenerDashboard } from "@/components/listeners/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminListenerDashboard />;
}
