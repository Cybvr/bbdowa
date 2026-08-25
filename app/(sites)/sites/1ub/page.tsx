import Header from "./components/header";
import BriefSection from "./components/brief-section";
import UnderstandingSection from "./components/understanding-section";
import ProposalSection from "./components/proposal-section";
import Footer from "./components/footer";
import ActiveSectionNav from "./active-section-nav";

export default function OneUtilityBankSite() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <article id="top">
          <BriefSection />
          <UnderstandingSection />
          <ProposalSection />
        </article>
      </main>
      <Footer />
      <ActiveSectionNav />
    </div>
  );
}
