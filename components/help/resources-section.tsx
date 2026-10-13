import { SectionHeading } from "@/components/dashboard/ui";
import { QuickCreate } from "@/components/quick-create";
import { getResources } from "@/lib/firebase/content";

export async function ResourcesSection() {
  const resources = await getResources();
  const groups = [...new Set(resources.map((resource) => resource.group))].sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <div className="flex justify-end"><QuickCreate type="resource" /></div>
      {resources.length ? (
        <div className="grid grid-cols-1 gap-y-8">
          {groups.map((group) => (
            <section key={group}>
              <SectionHeading>{group}</SectionHeading>
              <ul className="m-0 grid list-none gap-3 p-0">
                {resources.filter((resource) => resource.group === group).map((resource) => (
                  <li key={resource.slug} className="max-w-[70ch] text-[15px] leading-[1.5]">
                    {resource.href ? (
                      <a href={resource.href} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary">{resource.label}</a>
                    ) : <span className="font-semibold">{resource.label}</span>}
                    {resource.meta ? <span className="text-muted-foreground"> · {resource.meta}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : <p className="m-0 text-[15px] text-muted-foreground">No resources yet.</p>}
    </div>
  );
}
