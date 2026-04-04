"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAdminStore } from "@/store/admin-store";
import { Menu, Mail, Phone, Calendar } from "lucide-react";

export default function AdminCustomersClient() {
  const { customers, loading, fetchCustomers } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <>
      {mobileMenuOpen && (
        <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      )}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-foreground">Customers</h1>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-primary">
                {customers.length}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading.customers ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Loading…
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No customers found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Name", "Contact", "Address", "Joined"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border hover:bg-muted/30 transition"
                      >
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-foreground">
                            {c.full_name || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {c.email}
                            </span>
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {c.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-muted-foreground">
                          {c.address ? c.address : "—"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </>
  );
}
