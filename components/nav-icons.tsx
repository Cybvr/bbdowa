import type { ReactNode } from "react";

// Bespoke BBDO nav glyphs. One distinct mark per destination, drawn on a
// shared 24x24 grid with a consistent 1.7 stroke so the set reads as a family.

function Glyph({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };
export type NavIconComponent = (props: IconProps) => ReactNode;

// Home — gabled roof over a doorway
export const HomeIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-4a2 2 0 0 1 4 0v4" />
  </Glyph>
);

// Projects — kanban columns with a lifted card
export const ProjectsIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <rect x="3.5" y="4.5" width="5" height="12" rx="1" />
    <rect x="10" y="4.5" width="5" height="7" rx="1" />
    <rect x="16.5" y="4.5" width="4" height="15" rx="1" />
  </Glyph>
);

// Products — parcel with a top seam
export const ProductsIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M12 3 4 7v10l8 4 8-4V7Z" />
    <path d="M4 7l8 4 8-4" />
    <path d="M12 11v10" />
  </Glyph>
);

// Workflows — branching flow of nodes
export const WorkflowsIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <circle cx="12" cy="18" r="2.4" />
    <path d="M6 8.4v3a2 2 0 0 0 2 2h2.4" />
    <path d="M18 8.4v3a2 2 0 0 1-2 2h-2.4" />
  </Glyph>
);

// Agency — clustered org network
export const AgencyIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="5.5" cy="17" r="2.2" />
    <circle cx="18.5" cy="17" r="2.2" />
    <path d="M12 7.2v4.3M12 11.5 6.6 15M12 11.5 17.4 15" />
  </Glyph>
);

// Pitch — screen with a rising trend
export const PitchIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <rect x="3.5" y="4.5" width="17" height="11" rx="1.5" />
    <path d="M12 15.5V20M8.5 20h7" />
    <path d="M7.5 12l3-3 2.2 2.2L16.5 8" />
  </Glyph>
);

// Assets — layered stack
export const AssetsIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M12 3.5 3.5 8 12 12.5 20.5 8Z" />
    <path d="M4 12l8 4.2L20 12" />
    <path d="M4 16l8 4.2L20 16" />
  </Glyph>
);

// Brand assets — droplet on a swatch corner
export const BrandIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M12 3s5 5.3 5 8.8a5 5 0 0 1-10 0C7 8.3 12 3 12 3Z" />
    <path d="M9.6 12.4a2.4 2.4 0 0 0 2.4 2.4" />
  </Glyph>
);

// Resources — open reference book
export const ResourcesIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M12 6.5C10.5 5 8 4.5 4.5 5v13c3.5-.5 6 0 7.5 1.5" />
    <path d="M12 6.5C13.5 5 16 4.5 19.5 5v13c-3.5-.5-6 0-7.5 1.5" />
    <path d="M12 6.5v13" />
  </Glyph>
);

// Directory — grid of contact tiles
export const DirectoryIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
    <path d="M14 15.5h6.5M14 18.5h4.5" />
  </Glyph>
);

// Team — two overlapping figures
export const TeamIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.2a3 3 0 0 1 0 5.6" />
    <path d="M17 14.4a5.5 5.5 0 0 1 3.5 4.6" />
  </Glyph>
);

// Creators — pen nib
export const CreatorsIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M12 3 6 9l-2 8 8-2 6-6Z" />
    <path d="M11 5l8 8" />
    <path d="M4 17l4.2 4.2" />
    <circle cx="10.8" cy="11.2" r="1.4" />
  </Glyph>
);

// Updates — broadcast pulse
export const UpdatesIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="12" cy="12" r="2" />
    <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 15.8a5.4 5.4 0 0 0 0-7.6" />
    <path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 18.4a9 9 0 0 0 0-12.8" />
  </Glyph>
);

// Company — headquarters with flag
export const CompanyIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M5 20V8l7-3v15" />
    <path d="M12 20V9l7 2v9" />
    <path d="M3.5 20h17" />
    <path d="M8 11v0M8 14v0M15.5 13v0M15.5 16v0" />
  </Glyph>
);

// About — marked circle
export const AboutIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 7.8v0" />
  </Glyph>
);

// Careers — briefcase with handle
export const CareersIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="1.6" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
    <path d="M3.5 12.5h17" />
    <path d="M12 11.5v2" />
  </Glyph>
);

// Dashboard — panel grid
export const DashboardIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.3" />
    <rect x="3.5" y="15" width="7" height="5.5" rx="1.3" />
    <rect x="13.5" y="3.5" width="7" height="5.5" rx="1.3" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.3" />
  </Glyph>
);

// People — single figure
export const PeopleIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Glyph>
);

// Blog — feed lines with a pulse dot
export const BlogIcon: NavIconComponent = ({ className }) => (
  <Glyph className={className}>
    <path d="M5 6.5h14M5 12h14M5 17.5h8" />
    <circle cx="17.5" cy="17.5" r="1.6" />
  </Glyph>
);

export const NAV_ICON_SET: Record<string, NavIconComponent> = {
  Home: HomeIcon,
  Dashboard: DashboardIcon,
  Projects: ProjectsIcon,
  Products: ProductsIcon,
  Workflows: WorkflowsIcon,
  Agency: AgencyIcon,
  Pitch: PitchIcon,
  Assets: AssetsIcon,
  "Brand assets": BrandIcon,
  Resources: ResourcesIcon,
  Directory: DirectoryIcon,
  Team: TeamIcon,
  Creators: CreatorsIcon,
  People: PeopleIcon,
  Updates: UpdatesIcon,
  Blog: BlogIcon,
  Company: CompanyIcon,
  About: AboutIcon,
  Careers: CareersIcon,
};
