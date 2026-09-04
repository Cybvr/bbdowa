export default function BriefSection() {
  return (
    <section className="scroll-mt-24" id="overview">
      <figure className="relative h-[88vh] max-h-[860px] min-h-[560px] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster="/sites/1ub/campaign/deck/uploads/hero-audience-v3.jpg"
          src="/upload-latertofirebase/sites/1ub/campaign/deck/uploads/hero-audience-v3-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-label="A candid Lagos food-stall payment moment between a customer and vendor, animated"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/10" aria-hidden="true" />
        <div className="absolute inset-0 flex items-end px-4 pb-10 pt-28 md:px-8 md:pb-14">
          <div className="max-w-2xl space-y-5">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[0.94] tracking-tight text-balance text-paper">
              <span className="block">1U Bank Launch Pitch.</span>
              <span className="block">DDB Lagos, August 2026.</span>
            </h1>
            <p className="text-base md:text-lg text-paper/80 max-w-md">
              A launch campaign proposal for OneUtility Bank, prepared by DDB Lagos.
            </p>
          </div>
        </div>
      </figure>
    </section>
  );
}
