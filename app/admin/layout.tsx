import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure only admins can access admin routes
  await requireAdmin();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
