const proposalIndex = [
  { href: "#doc-landscape", label: "Landscape & competition" },
  { href: "#doc-objectives", label: "Objectives & strategy" },
  { href: "#doc-opportunity", label: "The opportunity" },
  { href: "#doc-idea", label: "Campaign platform: Only 1U" },
  { href: "#doc-flow", label: "Campaign flow" },
  { href: "#doc-channels", label: "Channel strategy" },
  { href: "#doc-activations", label: "Activations" },
  { href: "#doc-measurement", label: "Measurement" },
];

export default function ProposalSection() {
  return (
    <section className="scroll-mt-24 max-w-6xl mx-auto px-4 py-10 md:py-14" id="proposal">
      <div className="space-y-1 mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Proposal &amp; Campaign Strategy: Only 1U
        </h2>
        <p className="text-sm text-muted-foreground">
          A launch campaign built around the one thing only 1U can own: Utility Banking.
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

        {/* The Nest: Framed Document Viewport */}
        <div className="lg:col-span-4 lg:order-1 bg-card rounded-3xl border border-border overflow-hidden">
          {/* Document header */}
          <div className="flex items-center justify-between px-5 md:px-7 py-4 bg-muted/50 border-b border-border">
            <span className="text-sm font-bold text-foreground">
              1U Bank Launch Campaign Proposal
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              Confidential
            </span>
          </div>

          {/* Scrollable Viewport Body */}
          <div className="doc-scroll h-[750px] overflow-y-auto p-6 md:p-10 space-y-8 bg-background/40 scroll-smooth">

        <section id="doc-landscape" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Competition: everyone can move money</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Nigeria’s financial services market is no longer divided neatly between banks and fintechs. Traditional banks are becoming more digital, while fintechs now offer transfers, savings, credit, cards, bill payments and business tools.</p>
            <p>The category is crowded with similar promises: fast transfers, low fees, cashback and convenience. Most brands compete at the transaction layer—helping people move money or settle an immediate bill. The larger opportunity is to help customers make progress through the essential services they already pay for.</p>
            <p><small>Source: <a href="https://www.cbn.gov.ng/PaymentsSystem/modes.html">Central Bank of Nigeria, Payment Modes</a></small></p>
          </div>
        </section>

        <section id="doc-objectives" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Main objectives</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>Introduce Utility Banking as a new, easy-to-understand banking category.</li>
              <li>Build trust in 1U as a full-service digital bank, not another payment app.</li>
              <li>Expand perceptions of Utility Banking from payment convenience to meaningful progress.</li>
              <li>Drive Utility Account activation and a verified first useful action.</li>
              <li>Build a relationship that can grow from payment into planning, access and financing.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Key tasks</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>Explain what a Utility Account is in one clear sentence.</li>
              <li>Present the phone-number Utility Account as the entry point, not the entire proposition.</li>
              <li>Show how 1U can help customers pay, plan and build toward greater control.</li>
              <li>Use public proof to demonstrate useful outcomes, not only successful transactions.</li>
              <li>Build awareness across digital, mass media and grassroots touchpoints.</li>
              <li>Move people from curiosity to KYC, first useful action, repeat use and deeper product adoption.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">First, a few considerations</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>Nigerians already have several banking and payment options; novelty alone will not win.</li>
              <li>“Utility” is broad; the category needs a clear human value beyond a long menu of services.</li>
              <li>Utility needs are necessary, frequent and often urgent, but people also want greater control over what happens next.</li>
              <li>Trust begins with reliable transactions and grows through visible, meaningful outcomes.</li>
              <li>1U must feel locally fluent without appearing informal about security.</li>
              <li>The campaign must work for smartphone users, feature-phone users, salaried workers, merchants and families.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Understanding the industry landscape in Naija</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Digital payment is already mainstream. In the first half of 2024, the CBN recorded more than 22 billion e-payment transactions, with web transfers, mobile money, POS and mobile apps carrying most activity.</p>
            <p>Formal financial inclusion reached 64% in 2023, up from 56% in 2020. Access is growing, but the bigger opportunity lies in relevance: whether financial services help people manage pressure, access better solutions and build greater stability.</p>
            <p><small>Sources: <a href="https://www.cbn.gov.ng/PaymentsSystem/ePaymentStatistics.html">CBN e-Payment Statistics</a>; <a href="https://efina.org.ng/research/">EFInA Research</a></small></p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Key observation</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Every day, Nigerians spend money to keep life and business functioning.</p>
            <p>Too often, that spending only solves the immediate interruption. It does not create greater control over the next one.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Who are we up against?</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Traditional banks</strong> bring familiarity, licensing credibility and broad product depth.</p>
            <p><strong>OPay and PalmPay</strong> compete through reach, speed, agents, rewards and high-frequency payments.</p>
            <p><strong>Moniepoint</strong> owns strong merchant relevance and increasingly serves personal banking needs.</p>
            <p><strong>Kuda</strong> offers a polished digital-bank experience built around lifestyle, transfers, savings and control.</p>
            <p><strong>Bill-payment platforms</strong> compete for individual utility transactions without owning the wider banking relationship.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Comparison table</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/60 text-foreground font-bold border-b border-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <th className="p-3 font-bold border-b border-border">Brand type</th>
                  <th className="p-3 font-bold border-b border-border">Primary strength</th>
                  <th className="p-3 font-bold border-b border-border">Utility role</th>
                  <th className="p-3 font-bold border-b border-border">Strategic limitation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">Traditional banks</td>
                  <td className="p-3">Trust and full banking depth</td>
                  <td className="p-3">Bills as a transaction feature</td>
                  <td className="p-3">Rarely connects payment to planning, access or financing</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">OPay / PalmPay</td>
                  <td className="p-3">Scale, agents, speed and rewards</td>
                  <td className="p-3">Broad, high-frequency bill payment</td>
                  <td className="p-3">Value is centred on speed, reach and rewards</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">Moniepoint</td>
                  <td className="p-3">Merchant network and business banking</td>
                  <td className="p-3">Payments within a business-led ecosystem</td>
                  <td className="p-3">Utility progress is not the organising idea</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">Kuda</td>
                  <td className="p-3">Digital banking experience</td>
                  <td className="p-3">Convenient bill payment</td>
                  <td className="p-3">Utility remains a feature, not a relationship</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">1Utility Bank</td>
                  <td className="p-3">Full banking organised around essential needs</td>
                  <td className="p-3">Pay, plan, access and finance through Utility Banking</td>
                  <td className="p-3">Must prove that the promise extends beyond transactions</td>
                </tr>
              </tbody>
            </table>
            <p><small>Feature references: <a href="https://www.opaybank.com/services">OPay</a>, <a href="https://www.palmpay.com/">PalmPay</a>, <a href="https://moniepoint.com/">Moniepoint</a>, <a href="https://www.kuda.com/en-ng/">Kuda</a></small></p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Key takeout</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Most competitors can help someone pay a bill. Few are organised around what comes after the payment.</p>
            <p>1U’s opportunity is to connect immediate utility needs with planning, access, financing and longer-term progress.</p>
          </div>
        </section>

        <section id="doc-opportunity" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">The opportunity</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Define Utility Banking before the market reduces it to another bill-payment feature.</p>
            <p>The Utility Account can begin with what customers need today, then connect them to the banking tools that help them prepare for, access and finance what they need tomorrow.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">The Utility Progress model</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li><strong>Pay:</strong> Meet an immediate essential need.</li>
              <li><strong>Plan:</strong> Prepare for recurring responsibilities.</li>
              <li><strong>Access:</strong> Make better utility solutions attainable.</li>
              <li><strong>Progress:</strong> Build greater stability, control and productivity.</li>
            </ol>
            <p>Most fintechs compete at “Pay.” 1U has the opportunity to build a relationship across all four stages.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Who’s our audience?</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Digitally aware Nigerians who actively manage everyday pressure: salaried professionals, students, SMEs, market traders, gig workers, young families and mobile-first consumers.</p>
            <p>They may earn differently, but they share the same reality: money arrives in pieces, is quickly assigned to urgent needs and rarely creates enough room to plan ahead.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Their most significant trait</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Practical scepticism.</strong></p>
            <p>They will try something new when the benefit is immediate, but lasting preference comes when the service helps them gain greater control over what happens next.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Strategic position: From utility payments to utility progress</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>1Utility Bank is the full-service bank built around the essential payments, plans and investments that keep everyday life moving forward.</p>
            <p>Unlike platforms that stop at the transaction, 1U can make utilities the starting point for banking, saving, accessing and financing better outcomes.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Connecting the dots</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Audience reality:</strong> Money is constantly divided between urgent everyday needs, leaving little room to plan ahead.</p>
            <p>↓</p>
            <p><strong>Category tension:</strong> Financial apps help settle the immediate transaction, but the customer’s progress often ends there.</p>
            <p>↓</p>
            <p><strong>1U capability:</strong> The Utility Account creates an entry point into payments, planning, access and financing.</p>
            <p>↓</p>
            <p><strong>Brand role:</strong> Help people meet what life needs today while building greater control over tomorrow.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Brand personality framework</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Primary archetype: The Everyman.</strong> Familiar, inclusive, grounded and on the customer’s side.</p>
            <p><strong>Supporting archetype: The Caregiver.</strong> Protective, dependable and attentive to the responsibilities people carry.</p>
            <p><strong>Voice:</strong> Clear, warm, practical and confident. Never flashy, condescending or over-technical.</p>
            <p><strong>Behaviour:</strong> Show usefulness, prove reliability and speak like a trusted neighbour who understands the pressure.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Shaping “The Bank for Everyday Life” narrative</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Life does not wait for payday, perfect timing or a convenient banking moment. Data finishes. Electricity runs out. School fees become due. Transport must be paid.</p>
            <p>1U begins with these immediate realities, then connects customers to the tools that help them prepare, gain access and move forward with greater control.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Strategic conclusion: the market can move money</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Most banks and fintechs can help people complete a payment. Few are organised around the essential things that payment is meant to keep working.</p>
            <p>1U can own the space between the immediate utility need and the wider progress people and businesses are trying to make.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">The role only 1U can own</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>1U is built around the essential things people and businesses use money to keep running: airtime, data, electricity, water, transport, school fees, rent and more.</p>
            <p>Its Utility Account creates an entry point into a wider banking relationship that can help customers pay, plan, access solutions and make progress.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Campaign platform: Only 1U</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Only 1U makes Utility Banking the organising idea.</strong></p>
            <p>The campaign turns that distinction into visible proof: real people, real neighbourhoods and real moments when 1U helped something essential happen.</p>
            <p>“Only” must always be earned by a specific product truth, not used as a generic claim that any bank could make.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Trust follows proof</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>When money is involved, Nigerians rarely rely on advertising alone. We ask the group chat, the colleague, the neighbour, the barber, the market seller or the friend who has already tried it.</p>
            <p>That makes proof the campaign behaviour: every “Only 1U” claim must show what 1U uniquely helped someone do.</p>
          </div>
        </section>

        <section id="doc-idea" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">The launch campaign: Only 1U</h2>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">What “Only 1U” means</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>“Only 1U” is the claim that 1U is the one bank built around the essential things everyday life and business depend on.</p>
            <p>It is not a claim of superiority without evidence. It is a creative invitation to show the distinctive combination of Utility Accounts, everyday payments and a wider banking relationship.</p>
            <p>Across film, OOH, radio, digital and activation, the audience should see the specific thing that makes each moment uniquely 1U.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Campaign messaging hierarchy</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Master message:</strong> Only 1U is built around the essential things everyday life and business depend on.</p>
            <p><strong>Product proof:</strong> A phone number can become a Utility Account, creating a simple entry point into payments and wider banking.</p>
            <p><strong>Human benefit:</strong> 1U helps people handle what needs to happen today while building toward what comes next.</p>
            <p><strong>Action:</strong> Open your Utility Account and complete one useful action.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Creative mantra</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Show the thing only 1U can do.</strong></p>
            <p>This is the filter for every execution. If the idea could belong to any bank, it is not yet an “Only 1U” idea.</p>
          </div>
        </section>

        <section id="doc-flow" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Campaign flow</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Pre-launch — Digital:</strong> Create curiosity around real signs of useful progress without revealing the full brand story.</p>
            <p>→</p>
            <p><strong>Launch — Digital, OOH, installation, film and radio:</strong> Reveal 1U, demonstrate Utility Accounts and make “Only 1U” unmissable.</p>
            <p>→</p>
            <p><strong>Post-launch — Digital and OOH:</strong> Turn customers into proof, reinforce repeat use and keep useful outcomes visible.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Pre-launch: make Nigeria curious about what moved forward</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Seed fragments of real outcomes—a shop still open, a deadline met, a household moment uninterrupted—then ask what kind of bank is built around keeping these things moving.</p>
            <p>Use creators and street interviews to ask Nigerians about the last financial app they trusted—and who convinced them to try it.</p>
            <p>Open an early-access list built around phone numbers, preparing the audience for the Utility Account reveal.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Digital strategy</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Digital will move people through a proof-led journey: see an outcome, understand Utility Banking, activate an account, complete a first useful action, return for the next need and share the result.</p>
            <p>Every campaign asset should answer one of four questions: Does it work? What can it help me do? How do I start? What can I move toward next?</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Three digital strategy objectives</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li><strong>Build understanding:</strong> Make Utility Banking and the phone-number account simple to explain.</li>
              <li><strong>Convert interest:</strong> Drive completed KYC and a verified first useful action.</li>
              <li><strong>Build the relationship:</strong> Encourage repeat use, referrals and movement into planning, access or financing products.</li>
            </ol>
          </div>
        </section>

        <section id="doc-channels" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Channel strategy</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Reach:</strong> YouTube, TikTok, Instagram, Facebook and high-impact publisher inventory.</p>
            <p><strong>Intent:</strong> Search, app stores, comparison content and retargeting.</p>
            <p><strong>Trust:</strong> Creators, community pages, WhatsApp sharing and customer proof.</p>
            <p><strong>Action:</strong> App, landing page, referral links, CRM and merchant touchpoints.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Channel selection</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>TikTok and Instagram for culture, participation and creator proof.</li>
              <li>Facebook for broad adult reach, communities and retargeting.</li>
              <li>YouTube for film, demonstrations and high-attention storytelling.</li>
              <li>Google Search and app campaigns for active banking and bill-payment intent.</li>
              <li>WhatsApp for referrals, outcome stories and peer-to-peer credibility.</li>
              <li>X for launch conversation, service responsiveness and real-time proof.</li>
              <li>Programmatic display and local publishers for scale and frequency.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Channel rationale</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>The plan mirrors how financial trust travels in Nigeria. Mass platforms create awareness, search answers practical questions, creators make the behaviour relatable, and private sharing closes the trust gap.</p>
            <p>Performance media then reconnects every interested person with the exact next action they have not completed.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Summary and approach</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Show it.</strong> Demonstrate the Utility Account in real situations.</p>
            <p><strong>Prove it.</strong> Connect verified actions to visible, useful outcomes.</p>
            <p><strong>Expand it.</strong> Show how 1U can support what comes next: another need, better preparation or access to a larger solution.</p>
            <p><strong>Convert it.</strong> Use sequential retargeting to move people to the next unfinished action.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Influencer activation: The Proof Network</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Recruit a mix of trusted macro voices, neighbourhood creators, merchants, campus voices, family creators and gig workers.</p>
            <p>Each creator takes on a real-life utility challenge, uses 1U to resolve it and publishes both the verified action and what it made possible—not a scripted endorsement.</p>
            <p>The audience is invited to test the claim, share its own useful outcome and nominate the next person who should try it.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Pre-launch engagement</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li><strong>Who told you?</strong> Social prompts about the person who recommended a trusted financial service.</li>
              <li><strong>Outcome reveals:</strong> A familiar result is shown first; the verified 1U action behind it is uncovered later.</li>
              <li><strong>Phone-number waitlist:</strong> Nigerians register the number that will become their Utility Account.</li>
              <li><strong>Street proof:</strong> Short vox pops capture real attitudes to failed and successful transfers.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Launch: turn a new category into public proof</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Launch day reveals the connection between the mysterious outcomes and 1U’s Utility Account.</p>
            <p>Film introduces the idea emotionally. Digital explains the mechanism. OOH makes the proof unavoidable. Installations let people experience it. Radio carries the evidence into everyday movement.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Campaign introduction on digital</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>A coordinated digital takeover introduces “Only 1U” with a hero film, creator demonstrations, explainer cuts and a live stream of verified useful actions.</p>
            <p>Every asset links to one clear action: activate your Utility Account and complete your first useful action.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Lead KV deployment</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>The lead key visual places the person and useful outcome at the centre, with verified 1U activity as the reason to believe.</p>
            <p>It adapts across billboards, digital displays, social posts, app-store assets, merchant materials and contextual placements near everyday utility moments.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">TVC deployment</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>The hero film launches in broadcast and digital lengths: 60 seconds for story, 30 seconds for mass reach, 15 seconds for repetition and 6-second cuts for utility-specific reminders.</p>
            <p>Each edit ends with the “Only 1U” platform, a specific product proof and a direct invitation to activate a Utility Account.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Maximising reach and engagement</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>Use high-reach video to establish the category and campaign idea.</li>
              <li>Sequence utility-specific edits according to audience behaviour and context.</li>
              <li>Retarget viewers with a product demonstration, then the next relevant action.</li>
              <li>Amplify the strongest creator and customer proofs as paid media.</li>
              <li>Refresh proof by city, language and everyday need to prevent fatigue.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Short films: everyday pressure, everyday proof</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>A series of human stories shows 1U helping people respond to urgent moments and move toward greater control.</p>
            <p>Each story begins with pressure, introduces doubt, and ends with a useful outcome another person can verify.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Three short films</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>“Light Don Go.”</strong> During an important family moment, a neighbour receives money through a Utility Account and restores electricity before the moment is lost.</p>
            <p><strong>“Send Data, Not Sorry.”</strong> A gig worker running out of data before a deadline gets an instant top-up sent directly to their phone number.</p>
            <p><strong>“The Shop Must Open.”</strong> A market trader facing an urgent utility need sees proof from the seller next door and uses 1U to keep the business moving.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Radio adapted from TV</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Radio versions recreate each moment through familiar sound: the silence after power cuts, the warning tone of low data, the morning energy of a market opening.</p>
            <p>A narrator names the useful outcome first, then confirms the verified 1U action behind it before landing on: “Only 1U.”</p>
            <p>Adaptations should run in English, Pidgin, Yoruba, Igbo and Hausa.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Visuals</h2>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Post-launch: turn proof into habit</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Shift the campaign from launch storytelling to customer progress. Celebrate first useful actions, prompt repeat use and introduce the next relevant planning, access or financing product.</p>
            <p>Continue using city-specific and need-specific outcomes so the campaign remains current rather than becoming a static brand claim.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">UGC: My 1U Proof</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>After a successful action, customers receive a privacy-safe, shareable proof card that confirms what happened without exposing sensitive account information.</p>
            <p>Weekly prompts invite people to share what they kept running or moved forward with 1U. The strongest stories become paid social, OOH and radio proof—with consent.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Sustenance visuals</h2>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Offers: three ideas that reward useful behaviour</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>First Useful Action:</strong> A limited launch reward after a customer completes KYC and uses 1U for an eligible everyday need.</p>
            <p><strong>Keep Moving:</strong> A monthly benefit for customers who use 1U repeatedly across different needs, rewarding a growing relationship rather than one payment type.</p>
            <p><strong>Proof Pays:</strong> A referral reward triggered when the referred customer completes a verified first useful action, encouraging genuine adoption rather than empty sign-ups.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Memes, trivia and giveaways</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p>Use culturally fluent memes around familiar utility moments—low data at the wrong time, power cutting during the best part, or the group chat asking who has paid.</p>
            <p>Trivia explains Utility Banking through quick questions about everyday money habits. Giveaways should reward completed useful actions, not passive comments, keeping engagement connected to adoption.</p>
          </div>
        </section>

        <section id="doc-activations" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Activations: three ideas</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>1U Proof Stations:</strong> Pop-ups at markets, campuses and transport hubs where people activate accounts, complete a first useful action and leave with printed proof.</p>
            <p><strong>The Progress Wall:</strong> A live public installation showing anonymised useful actions and outcomes by neighbourhood as they happen.</p>
            <p><strong>1U Works Here:</strong> Merchants earn a visible trust mark after helping customers complete verified useful actions through 1U.</p>
          </div>
        </section>

        <section id="doc-measurement" className="space-y-4 pb-6 border-b border-border/40 scroll-mt-28">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Digital performance and measurement</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
              <li>Reach and effective frequency among priority audiences.</li>
              <li>Video completion and message recall for “Only 1U.”</li>
              <li>Cost per qualified app install or account-start event.</li>
              <li>KYC completion rate and cost per verified account.</li>
              <li>First useful action conversion and cost per verified first action.</li>
              <li>Repeat-use rates and movement into a second relevant product within 30 days.</li>
              <li>Referral conversion and share of acquisitions driven by customer proof.</li>
              <li>Brand lift across awareness, understanding, trust and primary-bank consideration.</li>
            </ol>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Digital reporting</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Live dashboard:</strong> Daily monitoring of spend, reach, conversion, KYC, first useful action, repeat behaviour and next-product uptake.</p>
            <p><strong>Weekly optimisation report:</strong> Creative, channel, audience and funnel performance with clear actions for the following week.</p>
            <p><strong>Phase reviews:</strong> A structured readout at the end of pre-launch, launch and post-launch, linking media performance to customer behaviour.</p>
            <p><strong>Final learning report:</strong> What drove trust, which proofs converted, where drop-off occurred and what should become always-on.</p>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Thank you</h2>
          <div className="space-y-3 text-foreground/90 text-xs md:text-sm leading-relaxed">
            <p><strong>Only 1U.</strong></p>
            <p>Show the thing only 1U can do.</p>
          </div>
        </section>

          </div>
        </div>
      </div>
    </section>
  );
}
