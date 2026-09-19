"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";
import type { Client } from "@/lib/clients";
import { clientHref } from "@/lib/clients";
import { ImageWithFallback } from "@/components/dashboard/ui";

const NEWS_IMAGES = [
  "/media/projects/jack-daniels/independence-day.jpg",
  "/media/projects/betano/make-we-bet-betano.png",
  "/media/projects/google/know-google-poster.jpg",
  "/media/projects/guinness/beerable-guinness.jpg",
  "/media/projects/visa/not-a-tourist-visa.jpg",
];

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!month) return String(year);

  return new Intl.DateTimeFormat("en-GB", {
    day: day ? "numeric" : undefined,
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

function CarouselControls({ onPrevious, onNext, label }: { onPrevious: () => void; onNext: () => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Previous ${label}`}
        onClick={onPrevious}
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Next ${label}`}
        onClick={onNext}
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function moveRail(rail: HTMLDivElement | null, direction: number) {
  rail?.scrollBy({ left: direction * 280, behavior: "smooth" });
}

export function DashboardHomeCarousels({ clients, posts }: { clients: Client[]; posts: BlogPost[] }) {
  const clientsRail = useRef<HTMLDivElement>(null);
  const newsRail = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-xl border border-border" aria-labelledby="latest-clients-heading">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id="latest-clients-heading" className="m-0 text-[15px] font-semibold tracking-tight">Latest clients</h2>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/clients" className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
              View all
            </Link>
            <CarouselControls label="clients" onPrevious={() => moveRail(clientsRail.current, -1)} onNext={() => moveRail(clientsRail.current, 1)} />
          </div>
        </div>
        <div ref={clientsRail} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto p-4">
          {clients.map((client) => (
            <Link
              key={client.slug}
              href={clientHref(client.slug)}
              className="group min-w-[190px] snap-start rounded-xl border border-border bg-background p-4 text-foreground no-underline transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-w-[210px]"
            >
              <ImageWithFallback
                src={client.profileImage}
                alt=""
                className="h-12 w-12 rounded-full bg-white object-contain p-1"
                fallbackClassName="h-12 w-12 rounded-full"
              />
              <strong className="mt-4 block truncate text-[15px] font-semibold">{client.name}</strong>
              <span className="mt-1 block truncate text-[12px] text-muted-foreground">{client.industry}</span>
              <span className="mt-5 block text-[11px] text-muted-foreground">{client.date ? formatDate(client.date) : "No date"}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="min-w-0 rounded-xl border border-border" aria-labelledby="latest-news-heading">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id="latest-news-heading" className="m-0 text-[15px] font-semibold tracking-tight">Latest news</h2>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/blog" className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
              View all
            </Link>
            <CarouselControls label="news" onPrevious={() => moveRail(newsRail.current, -1)} onNext={() => moveRail(newsRail.current, 1)} />
          </div>
        </div>
        <div ref={newsRail} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto p-4">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/dashboard/blog/${post.slug}`}
              className="group min-w-[250px] snap-start overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-w-[280px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={NEWS_IMAGES[index % NEWS_IMAGES.length]} alt="" aria-hidden="true" className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
              <div className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{post.category}</span>
                <strong className="mt-2 block line-clamp-3 text-[15px] font-semibold leading-[1.25]">{post.title}</strong>
                <span className="mt-4 block text-[12px] text-muted-foreground">{formatDate(post.publishedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
