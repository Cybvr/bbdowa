export default function UnderstandingSection() {
  return (
    <section className="scroll-mt-24 max-w-6xl mx-auto px-4 py-10 md:py-14" id="understanding">
      <div className="space-y-1 mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Understanding the Brief
        </h2>
        <p className="text-sm text-muted-foreground">
          DDB Lagos&apos;s read of the 1UBank brief, in six slides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-3 md:p-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border">
            <iframe
              className="w-full h-full border-0"
              src="/sites/1ub/campaign/deck/index.html"
              title="Understanding the Brief presentation"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>

      </div>
    </section>
  );
}
