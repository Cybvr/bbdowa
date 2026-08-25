export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-paper py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-paper/15 pb-8">
          <div className="space-y-2 text-sm text-paper/60 max-w-md">
            <p className="font-bold text-paper text-base">1U Bank Launch Pitch</p>
            <p>
              Prepared by DDB Lagos for OneUtility Bank, submitted to Uche Onono at
              iStrategyTech.
            </p>
            <p>
              Submission due 19 August 2026. Confidential — prepared for
              OneUtility Bank.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm font-semibold text-paper/60 items-start">
            <a className="hover:text-blue-soft transition-colors" href="#top">Back to top</a>
            <a className="hover:text-blue-soft transition-colors" href="#overview">Overview</a>
            <a className="hover:text-blue-soft transition-colors" href="#understanding">Understanding the Brief</a>
            <a className="hover:text-blue-soft transition-colors" href="#proposal">Proposal</a>
            <a
              className="hover:text-blue-soft transition-colors underline"
              href="/sites/1ub/campaign/deck/1u-bank-campaign-native.pptx"
              download
            >
              Download the deck
            </a>
          </div>
        </div>
        <p className="font-display text-4xl md:text-6xl text-paper/10 tracking-widest text-center select-none">
          1UTILITY
        </p>
      </div>
    </footer>
  );
}
