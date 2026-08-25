import Image from "next/image";

export default function BriefSection() {
  return (
    <section className="scroll-mt-24" id="overview">
      {/* Full-bleed hero: video with the launch copy overlaid, header floats above it */}
      <figure className="relative h-[88vh] max-h-[860px] min-h-[560px] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster="/sites/1ub/campaign/deck/uploads/hero-audience-v3.jpg"
          src="/sites/1ub/campaign/deck/uploads/hero-audience-v3-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-label="A candid Lagos food-stall payment moment between a customer and vendor, animated"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/10" aria-hidden="true" />
        <div className="absolute inset-0 flex flex-col justify-end gap-10 px-4 pb-10 pt-28 md:flex-row md:items-end md:justify-between md:px-8 md:pb-14">
          <div className="max-w-2xl space-y-5">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[0.94] tracking-tight text-balance text-paper">
              <span className="block">1U Bank Launch Pitch.</span>
              <span className="block">DDB Lagos, August 2026.</span>
            </h1>
            <p className="text-base md:text-lg text-paper/80 max-w-md">
              A launch campaign proposal for OneUtility Bank, prepared by DDB Lagos.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-5 md:items-end">
            <a
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-soft text-ink font-bold text-sm hover:bg-paper transition-colors"
              href="#overview-copy"
            >
              Read the brief
            </a>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/70 md:text-right">
              Confidential &middot; Prepared for OneUtility Bank
            </span>
          </div>
        </div>
      </figure>

      <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        {/* Market-context stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-card border border-border rounded-3xl p-7 md:p-8 flex flex-col gap-2">
            <p className="font-display text-5xl md:text-6xl text-blue leading-none">22bn+</p>
            <p className="text-sm font-medium text-muted-foreground">
              e-payment transactions in Nigeria, H1 2024
            </p>
          </div>
          <div className="bg-blue-mist rounded-3xl p-7 md:p-8 flex flex-col gap-2">
            <p className="font-display text-5xl md:text-6xl text-blue-deep leading-none">64%</p>
            <p className="text-sm font-medium text-ink/70">
              formal financial inclusion in 2023, up from 56% in 2020
            </p>
          </div>
          <div className="bg-ink text-paper rounded-3xl p-7 md:p-8 flex flex-col gap-2">
            <p className="font-display text-5xl md:text-6xl leading-none">15</p>
            <p className="text-sm font-medium text-paper/60">
              open questions we need 1U to answer before launch
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 px-1">
          Sources:{" "}
          <a
            className="underline hover:text-blue transition-colors"
            href="https://www.cbn.gov.ng/PaymentsSystem/ePaymentStatistics.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            CBN e-Payment Statistics
          </a>
          ,{" "}
          <a
            className="underline hover:text-blue transition-colors"
            href="https://efina.org.ng/research/"
            target="_blank"
            rel="noopener noreferrer"
          >
            EFInA Research
          </a>
        </p>

        {/* Overview: proposition, challenge, ask */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-5 mt-10 md:mt-14" id="overview-copy">
          <div className="space-y-3 lg:col-span-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Overview
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              OneUtility Bank, the launch challenge, and what DDB Lagos was asked for.
            </p>
          </div>

          <div className="lg:col-span-3 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative aspect-square overflow-hidden">
              <Image
                fill
                className="object-cover"
                src="/sites/1ub/campaign/deck/uploads/overview-product-utility-v2.jpg"
                alt="A phone, utility objects and a hand representing everyday payments"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="space-y-3 p-7 md:p-9">
              <h3 className="text-lg font-bold text-foreground">The product</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                <strong>OneUtility Bank (1UBank)</strong> is launching Africa&apos;s first &quot;Utility
                Bank,&quot; built around the reality that most people&apos;s money flows straight into
                utilities: electricity, airtime, data, water, rent, transport, school fees.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Its patented hook: every Nigerian phone number is automatically a Utility Account,
                converting transfers instantly without PINs or USSD codes, alongside a full banking
                ecosystem and a multilingual app (English, Igbo, Yoruba, Hausa).
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 overflow-hidden rounded-3xl bg-ink text-paper">
            <div className="relative aspect-square overflow-hidden">
              <Image
                fill
                className="object-cover"
                src="/sites/1ub/campaign/deck/uploads/overview-challenge-community-v2.jpg"
                alt="A diverse group of Nigerians sharing a phone in a market setting"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="space-y-3 p-7 md:p-9">
              <h3 className="text-lg font-bold">The challenge</h3>
              <p className="text-sm text-paper/90 leading-relaxed">
                Position 1U as a human, modern, innovative and trusted new category, not another
                fintech or traditional bank.
              </p>
              <p className="text-sm text-paper/60 leading-relaxed">
                The audience is broad: salaried workers, students, SMEs, traders, gig workers,
                families. The job is to introduce Utility Banking, build trust in 1U as a full-service
                bank, and prove the brand understands everyday Nigerian life.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-blue text-primary-foreground rounded-3xl p-7 md:p-9 flex flex-col md:flex-row gap-6 md:gap-10 md:items-center">
            <div className="space-y-2 md:max-w-xs">
              <h3 className="text-lg font-bold">The ask</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                A full launch campaign: creative concept, integrated media plan, storytelling
                assets, activation ideas and conversion/retention tactics.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-primary-foreground/20 md:pl-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
                  Due
                </p>
                <p className="text-sm font-semibold mt-1">19 August 2026</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
                  Submit to
                </p>
                <p className="text-sm font-semibold mt-1">Uche Onono, iStrategyTech</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
                  Judged on
                </p>
                <p className="text-sm font-semibold mt-1">
                  Creative strength, differentiation, activations, retention
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 md:mt-14" id="creative-mood">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Creative mood
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              A visual direction built from bold colour, surreal portraiture, collage and
              contemporary African cultural references.
            </p>
          </div>
          <figure className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-card">
            <Image
                src="/sites/1ub/campaign/deck/uploads/creative-moodboard.png"
              alt="Creative moodboard with bold colour, surreal portraits, collage and cultural references"
              width={2421}
              height={1075}
              className="h-auto w-full"
            />
          </figure>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mt-6">
            <figure className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  fill
                  className="object-cover"
                  src="/sites/1ub/campaign/deck/uploads/concept-utility-giant-v2.png"
                  alt="A monumental figure dressed in symbols of everyday utilities towers over a Lagos cityscape"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
            </figure>
            <figure className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  fill
                  className="object-cover"
                  src="/sites/1ub/campaign/deck/uploads/concept-everyday-oracle-v2.png"
                  alt="A seated oracle-like figure surrounded by orbiting symbols of everyday needs"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
            </figure>
            <figure className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  fill
                  className="object-cover"
                  src="/sites/1ub/campaign/deck/uploads/concept-one-number-world-v2.png"
                  alt="An oversized phone number transformed into a Nigerian street landscape a figure walks through"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
            </figure>
          </div>
        </section>
      </div>
    </section>
  );
}
