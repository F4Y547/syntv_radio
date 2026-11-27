import type { Metadata } from "next";
import { AdminListenerDashboard } from "@/components/listeners/admin-dashboard";

export const metadata: Metadata = {
  title: "Listener Analytics",
  robots: { index: false, follow: false },
};

export default function AdminListenersPage() {
  return <AdminListenerDashboard />;
}
