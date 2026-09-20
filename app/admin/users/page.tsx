"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { UserCreateAction } from "@/components/user-create-action";
import { UserActions } from "@/components/user-actions";
import { useAuth } from "@/components/auth-provider";
import { ImageWithFallback, PageHeader } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { creatorCategoryOptions, isCreatorUser, isTeamUser, userRoles, type User, type UserRole } from "@/lib/users";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";

type RoleFilter = "all" | UserRole | "pending";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  creator: "Creator",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${role === "admin" ? "bg-foreground text-background" : role === "creator" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function PendingBadge() {
  return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700">Pending</span>;
}

function UserRow({ user, categoryOptions }: { user: User; categoryOptions: string[] }) {
  const variant = isCreatorUser(user) && !isTeamUser(user) ? "creator" : "team";
  return (
    <tr className="border-t border-border align-middle first:border-t-0">
      <td className="px-4 py-3.5 sm:px-5">
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="relative grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-full border border-border bg-muted text-[11px] font-bold text-muted-foreground">
            <ImageWithFallback src={user.profileImage} alt={`${user.name} profile image`} className="h-full w-full object-cover" fallbackClassName="h-full w-full" fallbackSeed={user.name || user.email || user.slug} />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-[13px] font-semibold text-foreground">{user.name}</strong>
            <span className="block truncate text-xs text-muted-foreground">{user.email ?? "No email added"}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 sm:px-5">
        <div className="flex max-w-[220px] flex-wrap gap-1.5">
          {user.role === "pending" && !userRoles(user).length ? <PendingBadge /> : userRoles(user).map((role) => <RoleBadge key={role} role={role} />)}
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-foreground">
        <span className="block max-w-[190px] truncate">{user.title || "—"}</span>
        <span className="mt-0.5 block max-w-[190px] truncate text-xs text-muted-foreground">{user.department || "No department"}</span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <UserActions
          user={user}
          variant={variant}
          listHref="/admin/users"
          compactMenu
          includeEditAction
          categoryOptions={categoryOptions}
          onMutated={() => window.location.reload()}
        />
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { users, loading, error } = useFirestoreUsers();
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");

  const visibleUsers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((user) => {
        const roles = userRoles(user);
        const matchesRole = roleFilter === "all" || (roleFilter === "pending" ? user.role === "pending" : roles.includes(roleFilter));
        const searchable = [user.name, user.email, user.title, user.department, user.location].filter(Boolean).join(" ").toLowerCase();
        return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, roleFilter, users]);

  const categoryOptions = React.useMemo(() => creatorCategoryOptions(users), [users]);

  if (authLoading || loading) {
    return <UsersTableSkeleton />;
  }

  if (!isAdmin) {
    return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Users" /><p className="mt-8 text-sm text-muted-foreground">An admin account is required to manage users.</p></main>;
  }

  if (error) {
    return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Users" /><p className="mt-8 text-sm text-destructive">{error}</p></main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader
        title="Users"
        description="Manage every user profile, including admins, team members, creators, and people with multiple roles."
        meta={`${users.length} ${users.length === 1 ? "person" : "people"}`}
        actions={<UserCreateAction existingSlugs={users.map((user) => user.slug)} categoryOptions={categoryOptions} />}
      />

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:p-4">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search users</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="h-9 pl-9" />
          </label>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
              <SelectItem value="creator">Creators</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground sm:whitespace-nowrap">{visibleUsers.length} shown</span>
        </div>

        {visibleUsers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-muted/35 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-5">User</th>
                  <th className="px-4 py-3 sm:px-5">Roles</th>
                  <th className="px-4 py-3 sm:px-5">Position</th>
                  <th className="px-4 py-3 text-right sm:px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user, index) => <UserRow key={`${user.slug || "user"}-${user.email || "record"}-${index}`} user={user} categoryOptions={categoryOptions} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="m-0 text-[15px] font-semibold">No users found</p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">Try a different search or role filter.</p>
          </div>
        )}
      </section>
    </main>
  );
}
