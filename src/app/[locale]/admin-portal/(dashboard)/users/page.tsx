import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import CreateTeamUserForm from "@/components/admin/CreateTeamUserForm";

export default async function AdminUsersPage() {
  await requireAdmin();
  // RLS on `profiles` only lets a user read their own row — listing every
  // admin/inspector account needs the service-role client to bypass that.
  const adminClient = createAdminClient();

  const [t, { data: profiles, error }] = await Promise.all([
    getTranslations("AdminUsers"),
    adminClient
      .from("profiles")
      .select("id, email, is_admin, role, created_at")
      .or("is_admin.eq.true,role.eq.inspector")
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-start text-sm">
            <thead className="border-b border-border bg-muted text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("email")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("role")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("created")}</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{p.email}</td>
                  <td className="px-4 py-3">{p.is_admin ? t("admin") : t("inspector")}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTeamUserForm />
    </div>
  );
}
