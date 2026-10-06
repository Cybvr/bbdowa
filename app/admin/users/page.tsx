"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { CLIENT_INVITES_COLLECTION, type ClientInvite } from "@/lib/clients";
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
  client: "Client",
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

/** Clients added by email who haven't signed in yet. Once they sign in they show as normal users. */
function InvitedClients({ users }: { users: User[] }) {
  const [invites, setInvites] = React.useState<ClientInvite[]>([]);

  React.useEffect(() => onSnapshot(
    collection(firebaseDb, CLIENT_INVITES_COLLECTION),
    (snapshot) => setInvites(snapshot.docs.map((item) => item.data() as ClientInvite)),
    (cause) => console.error("Unable to load client invites", cause),
  ), []);

  const signedInEmails = new Set(users.filter((person) => person.uid).map((person) => person.email?.toLowerCase()).filter(Boolean));
  const waiting = invites.filter((invite) => !signedInEmails.has(invite.email)).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
  if (!waiting.length) return null;

  const remove = async (invite: ClientInvite) => {
    if (!window.confirm(`Remove the invite for ${invite.email}?`)) return;
    await deleteDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, invite.email)).catch((cause) => console.error("Unable to remove invite", cause));
  };

  return (
    <section className="mb-6" aria-label="Invited clients">
      <h2 className="m-0 mb-2 text-item-title font-semibold">Invited clients</h2>
      <ul className="m-0 grid list-none gap-2 p-0">
        {waiting.map((invite) => (
          <li key={invite.email} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-body font-semibold">{invite.name} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Invited</span></p>
              <p className="m-0 truncate text-sm text-muted-foreground">{invite.email} · {invite.clientName}</p>
            </div>
            <button type="button" onClick={() => void remove(invite)} className="shrink-0 text-xs font-semibold text-destructive hover:underline">Remove</button>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-2 text-xs text-muted-foreground">They’ll become clients of their company the first time they sign in with this email.</p>
    </section>
  );
}

function UserRow({ user, categoryOptions }: { user: User; categoryOptions: string[] }) {
  const { actualUser, startViewingAs } = useAuth();
  const variant = isCreatorUser(user) && !isTeamUser(user) ? "creator" : "team";
  const targetUid = user.uid;
  return (
    <ClickableTableRow href={user.slug || user.uid ? userHref(user, variant) : undefined} label={`Open user ${user.name}`} className="align-middle">
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
      .sort((a, b) => userAddedMs(b) - userAddedMs(a) || a.name.localeCompare(b.name));
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
              { value: "client", label: "Clients" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
        resultCount={plural(visibleUsers.length, "user")}
      />}>

      <InvitedClients users={users} />
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
