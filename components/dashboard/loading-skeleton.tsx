import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingRegion({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Loading content" className={className}>
      <span className="sr-only">Loading content…</span>
      {children}
    </div>
  );
}

function SkeletonRow({ lead = false }: { lead?: boolean }) {
  return (
    <div className={`flex items-center gap-4 border-b border-border last:border-0 ${lead ? "p-4" : "p-3.5"}`}>
      <Skeleton className={`shrink-0 rounded-lg ${lead ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12"}`} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className={lead ? "h-4 w-3/5" : "h-3.5 w-2/5"} />
      </div>
    </div>
  );
}

export function CreatorRailSkeleton() {
  return (
    <LoadingRegion className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="mt-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border">
            <Skeleton className="aspect-[1.35] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <LoadingRegion className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-5">
      {Array.from({ length: 2 }, (_, section) => (
        <section key={section} className="min-w-0">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {Array.from({ length: 3 }, (_, index) => <SkeletonRow key={index} />)}
          </div>
        </section>
      ))}
    </LoadingRegion>
  );
}

export function PageLoadingSkeleton({ titleWidth = "w-32", className = "" }: { titleWidth?: string; className?: string }) {
  return (
    <LoadingRegion className={`flex-1 px-5 pb-16 pt-8 sm:px-8 ${className}`}>
      <div className="border-b border-border pb-4">
        <Skeleton className={`h-7 ${titleWidth}`} />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </LoadingRegion>
  );
}

export function UsersTableSkeleton() {
  return (
    <LoadingRegion className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-px bg-border">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 bg-background px-5 py-4">
              <div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-44" /></div></div>
              <Skeleton className="h-5 w-20" />
              <div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-20" /></div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function ProfilePageSkeleton() {
  return (
    <LoadingRegion className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <Skeleton className="h-4 w-32" />
      <div className="mt-5 flex items-center gap-4 border-b border-border pb-5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-48 max-w-[50vw]" /></div>
      </div>
      <Skeleton className="mt-6 h-5 w-3/4 max-w-[850px]" />
      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="space-y-3 bg-background p-5"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-28" /></div>)}
      </div>
    </LoadingRegion>
  );
}

export function GraphPageSkeleton() {
  return (
    <LoadingRegion className="flex min-h-[calc(100vh-0px)] flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
      <div className="border-b border-border pb-4"><Skeleton className="h-7 w-24" /><Skeleton className="mt-2 h-4 w-64" /></div>
      <Skeleton className="mt-6 min-h-[520px] flex-1 rounded-xl" />
    </LoadingRegion>
  );
}

export function ClientWorkspaceSkeleton() {
  return (
    <LoadingRegion className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <div className="border-b border-border pb-5"><Skeleton className="h-4 w-28" /><Skeleton className="mt-3 h-8 w-64" /><Skeleton className="mt-2 h-4 w-96 max-w-full" /></div>
      <div className="mt-6 flex gap-2 overflow-hidden"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-28" /></div>
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div>
    </LoadingRegion>
  );
}

export function InlineLoadingSkeleton({ className = "h-4 w-28" }: { className?: string }) {
  return <LoadingRegion><Skeleton className={className} /></LoadingRegion>;
}
