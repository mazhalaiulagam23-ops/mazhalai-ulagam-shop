import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { listTeam, setUserRole } from "@/lib/security.functions";
import { ADMIN_MODULES, MANAGED_ROLES, PERMISSION_ACTIONS, ROLE_LABELS, type ManagedRole } from "@/lib/security";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [
      { title: "Team & Permissions | Mazhalai Ulagam Admin" },
      { name: "description", content: "Manage admin roles and module permissions for the Mazhalai Ulagam store team." },
      { property: "og:title", content: "Team & Permissions | Mazhalai Ulagam Admin" },
      { property: "og:description", content: "Role-based access control for the store team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

type TeamMember = Awaited<ReturnType<typeof listTeam>>[number];

type PermRow = {
  id?: string;
  role: ManagedRole;
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_settings: boolean;
};

function TeamPage() {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [team, permRows] = await Promise.all([
        listTeam(),
        supabase.from("role_permissions").select("*").order("module"),
      ]);
      setMembers(team);
      setPerms((permRows.data ?? []) as PermRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void load();
    else setLoading(false);
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.email.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q));
  }, [members, query]);

  if (!isAdmin) {
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">
        Only admins and super admins can manage roles and permissions.
      </div>
    );
  }

  const toggleRole = async (member: TeamMember, role: ManagedRole | "customer", grant: boolean) => {
    try {
      await setUserRole({ data: { userId: member.id, role, grant } });
      toast.success(`${grant ? "Granted" : "Removed"} ${ROLE_LABELS[role]} for ${member.email}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the role");
    }
  };

  const permValue = (role: ManagedRole, module: string, action: string) =>
    Boolean(perms.find((p) => p.role === role && p.module === module)?.[`can_${action}` as keyof PermRow]);

  const setPermValue = (role: ManagedRole, module: string, action: string, value: boolean) => {
    setPerms((rows) => {
      const existing = rows.find((r) => r.role === role && r.module === module);
      if (existing) {
        return rows.map((r) =>
          r === existing ? ({ ...r, [`can_${action}`]: value } as PermRow) : r,
        );
      }
      return [
        ...rows,
        {
          role,
          module,
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false,
          can_export: false,
          can_settings: false,
          [`can_${action}`]: value,
        } as PermRow,
      ];
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    const payload = perms
      .filter((p) => p.role !== "super_admin")
      .map(({ id: _id, ...rest }) => rest);
    const { error } = await supabase.from("role_permissions").upsert(payload, { onConflict: "role,module" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Permissions saved");
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Team & permissions</h1>
        <p className="text-sm text-muted-foreground">
          Assign roles and fine-tune what each role can do in every area of the admin.
        </p>
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">
            <UserCog className="mr-1.5 h-4 w-4" /> People
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Role permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="pt-4">
          <div className="surface-card p-4">
            <Input
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-4 max-w-sm"
            />
            {loading ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Person</th>
                      <th>Verified</th>
                      <th>Last sign-in</th>
                      {MANAGED_ROLES.map((role) => (
                        <th key={role} className="px-2 text-center">
                          {ROLE_LABELS[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((member) => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-semibold">{member.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </td>
                        <td className="text-xs">{member.emailConfirmed ? "Yes" : "Pending"}</td>
                        <td className="text-xs text-muted-foreground">
                          {member.lastSignInAt ? new Date(member.lastSignInAt).toLocaleString() : "Never"}
                        </td>
                        {MANAGED_ROLES.map((role) => (
                          <td key={role} className="px-2 text-center">
                            <Checkbox
                              checked={member.roles.includes(role)}
                              disabled={role === "super_admin" && (!isSuperAdmin || member.id === user?.id)}
                              onCheckedChange={(value) => void toggleRole(member, role, value === true)}
                              aria-label={`${ROLE_LABELS[role]} for ${member.email}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="pt-4">
          <div className="surface-card p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Super Admin always has full access and cannot be restricted.
            </p>
            <div className="space-y-6">
              {MANAGED_ROLES.filter((r) => r !== "super_admin").map((role) => (
                <div key={role}>
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide">{ROLE_LABELS[role]}</h2>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2">Module</th>
                          {PERMISSION_ACTIONS.map((action) => (
                            <th key={action} className="px-2 text-center capitalize">
                              {action}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ADMIN_MODULES.map((module) => (
                          <tr key={module.key} className="border-b last:border-0">
                            <td className="py-2 font-medium">{module.label}</td>
                            {PERMISSION_ACTIONS.map((action) => (
                              <td key={action} className="px-2 text-center">
                                <Checkbox
                                  checked={permValue(role, module.key, action)}
                                  onCheckedChange={(v) => setPermValue(role, module.key, action, v === true)}
                                  aria-label={`${action} ${module.label} for ${ROLE_LABELS[role]}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-5" onClick={() => void savePermissions()} disabled={saving}>
              {saving ? "Saving…" : "Save permissions"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
