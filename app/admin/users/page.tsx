"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Pencil, Shield } from "lucide-react";
import { UserCreateAction } from "@/components/user-create-action";
import { UserActions } from "@/components/user-actions";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, useListView, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { CARD_MENU_TRIGGER, CardGrid, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION } from "@/components/dashboard/list-card";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { creatorCategoryOptions, isCreatorUser, isTeamUser, userHref, userRoles, type User, type UserRole } from "@/lib/users";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { longDate, plural } from "@/lib/format";
import { isSuperAdminEmail } from "@/lib/job-migration";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

type RoleFilter = "all" | UserRole | "pending";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  creator: "Creator",
  client: "Client",
};

function RoleBadge({ role, email }: { role: UserRole; email?: string | null }) {
  const label = role === "admin" && isSuperAdminEmail(email) ? "Super Admin" : ROLE_LABELS[role];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 font-semibold uppercase tracking-[0.06em] ${role === "admin" ? "bg-foreground text-background" : role === "creator" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function PendingBadge() {
  return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 font-semibold uppercase tracking-[0.06em] text-amber-700">Pending</span>;
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value) return (value as { toMillis: () => number }).toMillis();
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** When someone joined: sign-up or added date, falling back to the last update for older imported records. */
function userAddedMs(user: User): number {
  const record = user as User & { createdAt?: unknown; updatedAt?: unknown };
  return toMs(record.createdAt) || toMs(user.addedAt) || toMs(record.updatedAt);
}

function UserItem({ user, categoryOptions, view }: { user: User; categoryOptions: string[]; view: ViewMode | "row" }) {
  const { actualUser, startViewingAs } = useAuth();
  const variant = isCreatorUser(user) && !isTeamUser(user) ? "creator" : "team";
  const targetUid = user.uid;
  const [editOpen, setEditOpen] = React.useState(false);
  const href = user.slug || user.uid ? userHref(user, variant) : undefined;
  const roles = <div className="flex flex-wrap gap-1.5 text-xs">{user.role === "pending" && !userRoles(user).length ? <PendingBadge /> : userRoles(user).map((role) => <RoleBadge key={role} role={role} email={user.email} />)}</div>;
  const added = userAddedMs(user) ? longDate(new Date(userAddedMs(user)).toISOString().slice(0, 10)) : "—";
  const cardActions = (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {targetUid && targetUid !== actualUser?.uid ? (
            <button
              type="button"
              onClick={() => startViewingAs({ uid: targetUid, name: user.name, email: user.email, picture: user.profileImage, role: user.role, clientId: user.clientId ?? null })}
              aria-label={`View ${user.name} as this user`}
              title="View as"
              className={CARD_MENU_TRIGGER}
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
          <UserActions
            user={user}
            variant={variant}
            listHref="/admin/users"
            compactMenu
            menuTriggerClassName={CARD_MENU_TRIGGER}
            editOpen={editOpen}
            onEditOpenChange={setEditOpen}
            includeEditAction
            categoryOptions={categoryOptions}
            onMutated={() => window.location.reload()}
          />
        </div>
  );
  if (view === "row") {
    const firstRole = userRoles(user)[0];
    return <MobileRow
      onActivate={() => setEditOpen(true)}
      image={user.profileImage}
      title={user.name}
      chip={firstRole ? (firstRole === "admin" && isSuperAdminEmail(user.email) ? "Super Admin" : ROLE_LABELS[firstRole]) : "Pending"}
      chipIcon={<Shield className="h-4 w-4 shrink-0" aria-hidden="true" />}
      detail={`${user.email || "No email"} · ${added}`}
      actions={href ? <Link href={href} aria-label={`View ${user.name}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link> : null}
      menu={<UserActions user={user} variant={variant} listHref="/admin/users" compactMenu menuTriggerClassName={ROW_ICON_ACTION} editOpen={editOpen} onEditOpenChange={setEditOpen} includeEditAction categoryOptions={categoryOptions} onMutated={() => window.location.reload()} />}
    />;
  }
  if (view === "cards") {
    return <ListCard onActivate={() => setEditOpen(true)} image={user.profileImage} title={href ? <Link href={href} className="text-foreground no-underline hover:text-primary">{user.name}</Link> : user.name} subtitle={added} menu={cardActions} />;
  }
  return (
    <ClickableTableRow onActivate={() => setEditOpen(true)} label={`Edit user ${user.name}`}>
      <TableCell className="font-semibold">
        {href ? <Link href={href} onClick={(event) => event.stopPropagation()} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">{user.name}</Link> : user.name}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
      <TableCell>{roles}</TableCell>
      <TableCell className="text-muted-foreground">{user.title || "—"}</TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">{added}</TableCell>
      <TableActionsCell
        primary={[
          ...(targetUid && targetUid !== actualUser?.uid ? [{ label: "View as", icon: <Eye className="h-4 w-4" />, onSelect: () => startViewingAs({ uid: targetUid, name: user.name, email: user.email, picture: user.profileImage, role: user.role, clientId: user.clientId ?? null }) }] : []),
          { label: "Edit", icon: <Pencil className="h-4 w-4" />, onSelect: () => setEditOpen(true) },
        ]}
        menu={<UserActions
          user={user}
          variant={variant}
          listHref="/admin/users"
          compactMenu
          menuIcon="horizontal"
          editOpen={editOpen}
          onEditOpenChange={setEditOpen}
          categoryOptions={categoryOptions}
          onMutated={() => window.location.reload()}
        />}
        label={`More actions for ${user.name}`}
      />
    </ClickableTableRow>
  );
}

const USER_SORTS: SortOption<"recent" | "name">[] = [
  { key: "recent", label: "Recently added" },
  { key: "name", label: "Name (A–Z)" },
];

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { users, loading, error } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");
  const [sort, setSort] = React.useState<"recent" | "name">("recent");
  const [view, setView] = useListView("users");

  const visibleUsers = React.useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const roles = userRoles(user);
        const matchesRole = roleFilter === "all" || (roleFilter === "pending" ? user.role === "pending" : roles.includes(roleFilter));
        const searchable = [user.name, user.email, user.title, user.department, user.location].filter(Boolean).join(" ").toLowerCase();
        return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => (sort === "name" ? 0 : userAddedMs(b) - userAddedMs(a)) || (a.name ?? "").localeCompare(b.name ?? ""));
  }, [roleFilter, search, sort, users]);

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
        actions={<UserCreateAction existingSlugs={users.map((user) => user.slug)} categoryOptions={categoryOptions} />}
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
              { value: "client", label: "Clients" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
        sortOptions={USER_SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visibleUsers.length, "user")}
        view={view}
        onViewChange={setView}
      />}>

      <section aria-label="Users">
        {visibleUsers.length ? view === "cards" ? (
          <CardGrid>
            {visibleUsers.map((user, index) => <UserItem key={`${user.slug || "user"}-${user.email || "record"}-${index}`} user={user} categoryOptions={categoryOptions} view="cards" />)}
          </CardGrid>
        ) : (
          <>
          <MobileRows>
            {visibleUsers.map((user, index) => <UserItem key={`${user.slug || "user"}-${user.email || "record"}-${index}`} user={user} categoryOptions={categoryOptions} view="row" />)}
          </MobileRows>
          <DesktopTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user, index) => <UserItem key={`${user.slug || "user"}-${user.email || "record"}-${index}`} user={user} categoryOptions={categoryOptions} view="table" />)}
              </TableBody>
            </Table>
          </DesktopTable>
          </>
        ) : (
          <EmptyState title="No users match" description="Try a different search or role filter." />
        )}
      </section>
    </DashboardListPage>
  );
}
