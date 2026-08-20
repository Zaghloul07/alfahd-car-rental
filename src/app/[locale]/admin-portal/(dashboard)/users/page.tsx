import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import CreateTeamUserForm from "@/components/admin/CreateTeamUserForm";
import TeamUserActions from "@/components/admin/TeamUserActions";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  // RLS on `profiles` only lets a user read their own row — listing every
  // admin/inspector account needs the service-role client to bypass that.
  const adminClient = createAdminClient();

  const [t, { data: profiles, error }, { data: authUsers }] = await Promise.all([
    getTranslations("AdminUsers"),
    adminClient
      .from("profiles")
      .select("id, email, is_admin, role, created_at")
      .or("is_admin.eq.true,role.eq.inspector")
      .order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers(),
  ]);
  if (error) throw error;

  const lockedIds = new Set(
    (authUsers?.users ?? [])
      .filter((u) => u.banned_until && new Date(u.banned_until) > new Date())
      .map((u) => u.id)
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-border bg-muted text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("email")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("role")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("created")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => {
                const locked = lockedIds.has(p.id);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.email}</td>
                    <td className="px-4 py-3">{p.is_admin ? t("admin") : t("inspector")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          locked
                            ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        }`}
                      >
                        {locked ? t("locked") : t("active")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <TeamUserActions userId={p.id} locked={locked} isSelf={p.id === admin.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTeamUserForm />
    </div>
  );
}
