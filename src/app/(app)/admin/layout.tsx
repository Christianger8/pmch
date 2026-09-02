import { requireAdmin } from "@/features/auth/session";
import { AdminTabs } from "./admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <AdminTabs />
      {children}
    </div>
  );
}
