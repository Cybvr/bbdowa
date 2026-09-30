import { redirect } from "next/navigation";

type LegacyTasksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyTasksPage({ searchParams }: LegacyTasksPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const search = query.toString();
  const suffix = search ? `?${search}` : "";
  redirect(`/dashboard/work${suffix}`);
}
