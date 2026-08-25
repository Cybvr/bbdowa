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
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-3 md:p-4">
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

        <div className="lg:col-span-2 bg-ink text-paper rounded-3xl p-7 md:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Cover to close</h3>
            <p className="text-sm text-paper/60 leading-relaxed">
              Business, challenge, audience, desired response and the questions we still need
              answered before launch.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-paper text-ink font-bold text-sm hover:bg-blue-soft transition-colors"
              href="/sites/1ub/campaign/deck/index.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the deck in a new tab
            </a>
            <a
              className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-paper/25 text-paper font-bold text-sm hover:bg-paper/10 transition-colors"
              href="/upload-latertofirebase/sites/1ub/campaign/deck/1u-bank-campaign-native.pptx"
              download
            >
              Download as PowerPoint
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
