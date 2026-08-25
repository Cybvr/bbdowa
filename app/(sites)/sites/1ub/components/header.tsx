export default function Header() {
  return (
    <div className="sticky top-4 z-20 mx-4 md:mx-8">
      <header
        className="site-header flex items-center gap-4 min-h-[4rem] px-4 md:px-6 bg-paper/85 backdrop-blur-md border border-border rounded-full shadow-[0_1px_2px_oklch(0_0_0/0.04),0_8px_24px_oklch(0_0_0/0.06)]"
      >
        <a className="flex-none" href="#top" aria-label="1Utility Bank home">
          <img className="w-24 md:w-28 h-auto" src="/sites/1ub/campaign/logo.svg" alt="1Utility Bank" />
        </a>
        <nav
          className="section-menu flex items-center gap-4 md:gap-7 overflow-x-auto ml-2 md:ml-6 no-scrollbar"
          id="section-menu"
          aria-label="Page sections"
        >
          <a
            className="text-xs md:text-sm font-bold text-muted-foreground hover:text-blue transition-colors py-2 border-b-2 border-transparent aria-[current=true]:border-blue aria-[current=true]:text-blue whitespace-nowrap"
            href="#top"
          >
            Home
          </a>
          <a
            className="text-xs md:text-sm font-bold text-muted-foreground hover:text-blue transition-colors py-2 border-b-2 border-transparent aria-[current=true]:border-blue aria-[current=true]:text-blue whitespace-nowrap"
            href="#overview"
          >
            Brief
          </a>
          <a
            className="text-xs md:text-sm font-bold text-muted-foreground hover:text-blue transition-colors py-2 border-b-2 border-transparent aria-[current=true]:border-blue aria-[current=true]:text-blue whitespace-nowrap"
            href="#understanding"
          >
            Understanding
          </a>
          <a
            className="text-xs md:text-sm font-bold text-muted-foreground hover:text-blue transition-colors py-2 border-b-2 border-transparent aria-[current=true]:border-blue aria-[current=true]:text-blue whitespace-nowrap"
            href="#proposal"
          >
            Proposal
          </a>
        </nav>
        <a
          className="ml-auto inline-flex items-center px-4 py-2 rounded-full bg-blue text-primary-foreground text-xs md:text-sm font-bold hover:bg-blue-deep transition-colors whitespace-nowrap"
          href="/sites/1ub/campaign/deck/1u-bank-campaign-native.pptx"
          download
        >
          Download the deck
        </a>
      </header>
    </div>
  );
}
