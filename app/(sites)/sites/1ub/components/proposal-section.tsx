import type { ReactNode } from "react";

const proposalIndex = [
  { href: "#doc-context", label: "Context & objectives" },
  { href: "#doc-strategy", label: "Strategy" },
  { href: "#doc-platform", label: "Brand platform" },
  { href: "#doc-campaigns", label: "Campaign ideas" },
  { href: "#doc-execution", label: "Execution direction" },
  { href: "#doc-activations", label: "Activations" },
  { href: "#doc-measurement", label: "Measurement" },
];

function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28"
    >
      <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
        {title}
      </h2>
      <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

const campaignIdeas = [
  {
    number: "01",
    title: "You-tility",
    anchor: "Convenience",
    concept:
      "1U places you squarely at the centre of an expanding world of utility payments, benefits and possibilities.",
    visual:
      "YOU sits at the literal centre, with utilities, benefits and possibilities orbiting around you.",
    messages: [
      "Everything essential, centred around you.",
      "Your utilities. Your benefits. Your possibilities.",
      "The world of utilities, built around you.",
    ],
  },
  {
    number: "02",
    title: "Due-2-Done",
    anchor: "Control",
    concept:
      "Everyday life is packed with things that are due. 1U efficiently converts daily stress into completed action.",
    visual: "The status DUE smoothly transforms into DONE.",
    messages: [
      "Data due. Done.",
      "Light due. Done.",
      "Airtime due. Done.",
      "When it is due, get it done with 1U.",
    ],
  },
  {
    number: "03",
    title: "Bills as Beneficiaries",
    anchor: "Connection",
    concept:
      "1U makes paying utility bills feel as effortless and familiar as sending money to a close friend.",
    visual: "Utility billers are styled visually like contacts in your phone list.",
    messages: [
      "Pay your bills like you pay your people.",
      "Your bills are now your beneficiaries.",
      "Utilities, now in your contact list.",
      "If they are in your contacts, they are easy to pay.",
    ],
  },
  {
    number: "04",
    title: "Only 1U",
    anchor: "Differentiation",
    concept:
      "A proof-led route that shows the specific things 1U can uniquely help people handle, from essential payments into broader banking progress.",
    visual:
      "Real people, real neighbourhoods and real moments when 1U helped something essential happen.",
    messages: [
      "Show the thing only 1U can do.",
      "Built around what life needs next.",
      "From what needs doing to what becomes possible.",
    ],
  },
];

export default function ProposalSection() {
  return (
    <section
      className="scroll-mt-24 max-w-6xl mx-auto px-4 py-10 md:py-14"
      id="proposal"
    >
      <div className="space-y-1 mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Brand Strategy &amp; Campaign Routes
        </h2>
        <p className="text-sm text-muted-foreground">
          From One You-niverse to four creative routes for introducing Utility Banking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-5 items-start">
        <nav
          aria-label="Proposal sections"
          className="lg:col-span-2 lg:order-2 bg-blue-mist rounded-3xl p-6 md:p-7 lg:sticky lg:top-28 space-y-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-deep/70 mb-2">
            Jump to
          </p>
          {proposalIndex.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block text-sm font-semibold text-ink/80 hover:text-blue py-1.5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="lg:col-span-4 lg:order-1 bg-card rounded-3xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 md:px-7 py-4 bg-muted/50 border-b border-border">
            <span className="text-sm font-bold text-foreground">
              1U Brand Strategy &amp; Campaign Deck
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              Confidential
            </span>
          </div>

          <div className="doc-scroll h-[750px] overflow-y-auto p-6 md:p-10 space-y-8 bg-background/40 scroll-smooth">
            <DocSection id="doc-context" title="Main objectives">
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li>Introduce Utility Banking as a new, easy-to-understand banking category.</li>
                <li>Build trust in 1U as a full-service digital bank, not another payment app.</li>
                <li>Expand Utility Banking from payment convenience to meaningful progress.</li>
                <li>Drive Utility Account activation and a verified first useful action.</li>
                <li>Build a relationship that can grow from payment into planning, access and financing.</li>
              </ul>
            </DocSection>

            <DocSection title="Key tasks">
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li>Explain what a Utility Account is in one clear sentence.</li>
                <li>Present the phone-number Utility Account as the entry point, not the entire proposition.</li>
                <li>Show how 1U can help customers pay, plan and build toward greater control.</li>
                <li>Use public proof to demonstrate useful outcomes, not only successful transactions.</li>
                <li>Build awareness across digital, mass media and grassroots touchpoints.</li>
                <li>Move people from curiosity to KYC, first useful action, repeat use and deeper adoption.</li>
              </ul>
            </DocSection>

            <DocSection title="Market context">
              <p>Life is chaotic. Digital payments are now a permanent fixture of everyday life in Nigeria.</p>
              <p>More than 22 billion e-payment transactions were recorded by the CBN in the first half of 2024 across web transfers, mobile money, POS and mobile apps.</p>
              <p>Formal financial inclusion reached 64% in 2023, up from 56% in 2020. Access is growing, but the everyday experience remains fragmented across multiple apps, USSD codes and single-purpose platforms.</p>
              <p><small>Sources: <a className="underline hover:text-blue" href="https://www.cbn.gov.ng/PaymentsSystem/ePaymentStatistics.html">CBN e-Payment Statistics</a>; <a className="underline hover:text-blue" href="https://efina.org.ng/research/">EFInA Research</a></small></p>
            </DocSection>

            <DocSection title="Audience and consumer insight">
              <p><strong>Audience:</strong> Digitally aware Nigerians who actively manage everyday pressure: salaried professionals, students, SMEs, market traders, gig workers, young families and mobile-first consumers.</p>
              <p><strong>Shared reality:</strong> Money arrives in pieces, is quickly assigned to urgent needs and rarely creates enough room to plan ahead.</p>
              <p><strong>Consumer need:</strong> People want to feel like they have their lives handled and under control.</p>
              <p><strong>Most significant trait:</strong> Practical scepticism. People will try something new when the benefit is immediate, but lasting preference comes when the service helps them gain greater control over what happens next.</p>
            </DocSection>

            <DocSection id="doc-strategy" title="The business challenge">
              <p>Current market players treat utility payments as a basic, transactional add-on rather than the anchor of a customer&apos;s financial life.</p>
              <p>1U must be understood as a reliable, full-service digital bank that starts with essential utilities and helps customers move beyond payment into planning, access and financing.</p>
            </DocSection>

            <DocSection title="The competitive landscape">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                  <thead className="bg-muted/60 text-foreground font-bold border-b border-border">
                    <tr>
                      <th className="p-3 border-b border-border">Brand type</th>
                      <th className="p-3 border-b border-border">Primary strength</th>
                      <th className="p-3 border-b border-border">Strategic limitation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-3">Traditional banks</td><td className="p-3">Trust, credibility and broad products</td><td className="p-3">Rarely connect bills to planning, access or progress</td></tr>
                    <tr><td className="p-3">OPay &amp; PalmPay</td><td className="p-3">Scale, speed and agent network</td><td className="p-3">Focus on instant transactions and rewards</td></tr>
                    <tr><td className="p-3">Moniepoint</td><td className="p-3">Merchant network and business tools</td><td className="p-3">Utilities are not the organising strategy</td></tr>
                    <tr><td className="p-3">Kuda</td><td className="p-3">Polished digital-bank experience</td><td className="p-3">Utilities remain an isolated feature</td></tr>
                    <tr><td className="p-3">Bill-payment platforms</td><td className="p-3">Individual utility convenience</td><td className="p-3">Do not build the wider banking relationship</td></tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection title="The strategic opportunity">
              <p><strong>From Utility Payments to Utility Progress.</strong> 1Utility Bank is the full-service bank built around the essential payments, plans and investments that keep everyday life moving forward.</p>
              <p>Unlike platforms that stop at the transaction, 1U can make utilities the starting point for banking, saving, accessing and financing better outcomes.</p>
              <div className="rounded-2xl bg-blue-mist p-5 space-y-2 text-ink">
                <p><strong>Audience reality:</strong> Money is divided between urgent everyday needs.</p>
                <p><strong>Category tension:</strong> Financial apps settle the immediate transaction, but progress often ends there.</p>
                <p><strong>1U capability:</strong> The Utility Account creates an entry point into payments, planning, access and financing.</p>
                <p><strong>Brand role:</strong> Help people meet what life needs today while building greater control over tomorrow.</p>
              </div>
            </DocSection>

            <DocSection title="Utility Account and value proposition">
              <p><strong>A Utility Account is a phone-number-based account that lets customers manage essential payments and access broader banking services through 1U.</strong></p>
              <p>The phone number makes the Utility Account easy to understand and activate. It is the entry point into a broader relationship that helps customers pay, plan, access and finance better outcomes.</p>
              <p><strong>1U gives people more control over what their money needs to handle by bringing basic banking and essential utility management into one connected experience.</strong></p>
            </DocSection>

            <DocSection title="The Utility Progress model">
              <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li><strong>Pay:</strong> Meet an immediate essential need.</li>
                <li><strong>Plan:</strong> Prepare for recurring responsibilities.</li>
                <li><strong>Access:</strong> Make better utility solutions attainable.</li>
                <li><strong>Progress:</strong> Build greater stability, control and productivity.</li>
              </ol>
              <p>Most fintechs compete at “Pay.” 1U has the opportunity to build a relationship across all four stages.</p>
            </DocSection>

            <DocSection id="doc-platform" title="Brand platform">
              <p><strong>Brand role:</strong> 1U builds banking around the customer. The financial system should work around the way people live, not force people to work around the system.</p>
              <p><strong>Strategic message:</strong> One You-niverse—a connected, full-service banking relationship built around the customer&apos;s essential payments, plans and investments.</p>
              <p><strong>Customer-facing expression:</strong> Everything essential, centred around you.</p>
            </DocSection>

            <DocSection title="Brand personality">
              <p><strong>Primary archetype: The Everyman.</strong> Familiar, inclusive, grounded and on the customer&apos;s side.</p>
              <p><strong>Supporting archetype: The Caregiver.</strong> Protective, dependable and attentive to the responsibilities people carry.</p>
              <p><strong>Voice:</strong> Clear, warm, practical and confident. Never flashy, condescending or over-technical.</p>
              <p><strong>Behaviour:</strong> Show usefulness, prove reliability and speak like a trusted neighbour who understands the pressure.</p>
            </DocSection>

            <DocSection id="doc-campaigns" title="Four campaign ideas">
              <p>These are four creative routes from the same brand platform. They are alternative campaign ideas, not four competing master messages to run at once.</p>
              <div className="space-y-5">
                {campaignIdeas.map((idea) => (
                  <article key={idea.title} className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg md:text-xl font-extrabold text-foreground">
                        {idea.number} · {idea.title}
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-deep">
                        {idea.anchor}
                      </span>
                    </div>
                    <p><strong>Concept:</strong> {idea.concept}</p>
                    <p><strong>Visual metaphor:</strong> {idea.visual}</p>
                    <div>
                      <p className="font-semibold mb-1">Key messaging:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {idea.messages.map((message) => <li key={message}>{message}</li>)}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </DocSection>

            <DocSection id="doc-execution" title="Execution direction">
              <p>The selected route should make the same strategic promise visible across film, OOH, radio, digital, creators and grassroots touchpoints: 1U helps people handle what life needs today while building greater control over tomorrow.</p>
              <p>Every execution should explain the Utility Account simply, show a useful outcome and connect the immediate action to the wider banking relationship.</p>
              <p><strong>Pre-launch:</strong> Build curiosity around the everyday needs people are already trying to handle.</p>
              <p><strong>Launch:</strong> Reveal the selected campaign idea, explain Utility Banking and drive activation plus a verified first useful action.</p>
              <p><strong>Post-launch:</strong> Turn customer outcomes into public proof, reinforce repeat use and show the next stage of Utility Progress.</p>
            </DocSection>

            <DocSection title="Channel strategy">
              <p><strong>Reach:</strong> YouTube, TikTok, Instagram, Facebook, broadcast and high-impact publisher inventory.</p>
              <p><strong>Intent:</strong> Search, app stores, comparison content and retargeting.</p>
              <p><strong>Trust:</strong> Creators, community pages, WhatsApp sharing and customer proof.</p>
              <p><strong>Action:</strong> App, landing page, referral links, CRM and merchant touchpoints.</p>
            </DocSection>

            <DocSection id="doc-activations" title="Activations">
              <p><strong>1U Proof Stations:</strong> Pop-ups at markets, campuses and transport hubs where people activate accounts, complete a first useful action and leave with printed proof.</p>
              <p><strong>The Progress Wall:</strong> A live public installation showing anonymised useful actions and outcomes by neighbourhood as they happen.</p>
              <p><strong>1U Works Here:</strong> Merchants earn a visible trust mark after helping customers complete verified useful actions through 1U.</p>
            </DocSection>

            <DocSection id="doc-measurement" title="Measurement">
              <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li>Reach, effective frequency, video completion and message recall.</li>
                <li>Cost per qualified app install or account-start event.</li>
                <li>KYC completion rate and cost per verified account.</li>
                <li>First useful action conversion and cost per verified first action.</li>
                <li>Repeat-use rates and movement into a second relevant product within 30 days.</li>
                <li>Referral conversion and share of acquisitions driven by customer proof.</li>
                <li>Brand lift across awareness, understanding, trust and primary-bank consideration.</li>
              </ol>
              <p><strong>Reporting:</strong> A live dashboard, weekly optimisation reports, phase reviews and a final learning report should connect media performance to customer behaviour.</p>
            </DocSection>

            <section className="space-y-3 pb-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">The direction</h2>
              <p className="text-foreground/90 text-xs md:text-sm leading-relaxed"><strong>Everything essential, centred around you.</strong></p>
              <p className="text-foreground/90 text-xs md:text-sm leading-relaxed">The strategic platform stays consistent. The four campaign ideas give 1U different ways to make that promise useful, memorable and provable.</p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
