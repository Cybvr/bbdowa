"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { UserCreateAction } from "@/components/user-create-action";
import { UserActions } from "@/components/user-actions";
import { BackfillUidsAction } from "@/components/backfill-uids-action";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { creatorCategoryOptions, isCreatorUser, isTeamUser, userHref, userRoles, type User, type UserRole } from "@/lib/users";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { plural } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

type RoleFilter = "all" | UserRole | "pending";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  creator: "Creator",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 font-semibold uppercase tracking-[0.06em] ${role === "admin" ? "bg-foreground text-background" : role === "creator" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function PendingBadge() {
  return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 font-semibold uppercase tracking-[0.06em] text-amber-700">Pending</span>;
}

function UserRow({ user, categoryOptions }: { user: User; categoryOptions: string[] }) {
  const { actualUser, startViewingAs } = useAuth();
  const variant = isCreatorUser(user) && !isTeamUser(user) ? "creator" : "team";
  const targetUid = user.uid;
  return (
    <ClickableTableRow href={user.slug ? userHref(user, variant) : undefined} label={`Open user ${user.name}`} className="align-middle">
      <TableCell className="px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <strong className="block truncate font-semibold text-foreground">{user.name}</strong>
          <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
            {user.role === "pending" && !userRoles(user).length ? <PendingBadge /> : userRoles(user).map((role) => <RoleBadge key={role} role={role} />)}
            <span className="hidden truncate sm:inline">{user.email ?? "No email added"}</span>
            {user.title ? <span className="hidden truncate lg:inline">· {user.title}</span> : null}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {targetUid && targetUid !== actualUser?.uid ? (
            <button
              type="button"
              onClick={() => startViewingAs({ uid: targetUid, name: user.name, email: user.email, picture: user.profileImage, role: user.role })}
              aria-label={`View ${user.name} as this user`}
              title="View as"
              className="grid h-8 w-8 place-items-center rounded-md border-0 bg-transparent p-0 text-muted-foreground shadow-none transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <UserActions
            user={user}
            variant={variant}
            listHref="/admin/users"
            compactMenu
            includeEditAction
            categoryOptions={categoryOptions}
            onMutated={() => window.location.reload()}
          />
        </div>
      </TableCell>
    </ClickableTableRow>
  );
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { users, loading, error } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");

  const visibleUsers = React.useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const roles = userRoles(user);
        const matchesRole = roleFilter === "all" || (roleFilter === "pending" ? user.role === "pending" : roles.includes(roleFilter));
        const searchable = [user.name, user.email, user.title, user.department, user.location].filter(Boolean).join(" ").toLowerCase();
        return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roleFilter, search, users]);

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
    <DashboardListPage
        title="Users"
        actions={
          <div className="flex items-center gap-2">
            <BackfillUidsAction users={users} />
            <UserCreateAction existingSlugs={users.map((user) => user.slug)} categoryOptions={categoryOptions} />
          </div>
        }
      toolbar={<FilterBar
        panelId="admin-users-filter"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users"
        filters={[
          {
            label: "Role",
            value: roleFilter,
            onChange: (value) => setRoleFilter(value as RoleFilter),
            options: [
              { value: "all", label: "All roles" },
              { value: "manager", label: "Managers" },
              { value: "creator", label: "Creators" },
              { value: "admin", label: "Admins" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
        resultCount={plural(visibleUsers.length, "user")}
      />}>

      <section className="overflow-x-auto">
        {visibleUsers.length ? (
          <div>
            <Table className="w-full table-fixed border-collapse text-left">
              <TableHeader className="font-semibold uppercase text-muted-foreground">
                <TableRow>
                  <TableHead className="px-4 py-3 sm:px-5">User</TableHead>
                  <TableHead className="w-28 px-4 py-3 text-right sm:px-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user, index) => <UserRow key={`${user.slug || "user"}-${user.email || "record"}-${index}`} user={user} categoryOptions={categoryOptions} />)}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="m-0 font-semibold">No users found</p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">Try a different search or role filter.</p>
          </div>
        )}
      </section>
    </DashboardListPage>
  );
}
