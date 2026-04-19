import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { bookings: true, hostels: true } },
    },
  });

  const ROLE_CLS: Record<string, string> = {
    STUDENT: "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]",
    OWNER:   "text-blue-700 bg-blue-50 border-blue-200",
    ADMIN:   "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]",
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="py-10">
          <Link href="/admin" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">← Admin</Link>
          <h1 className="text-3xl font-extrabold text-[var(--color-ink)] mt-2" style={{ fontFamily: "var(--font-display)" }}>
            Users ({users.length})
          </h1>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{u.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {u.email} · Joined {formatDate(u.createdAt)}
                    {u.role === "OWNER" && ` · ${u._count.hostels} hostels`}
                    {u.role === "STUDENT" && ` · ${u._count.bookings} bookings`}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_CLS[u.role]}`}>
                  {u.role.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
