import Header from "./components/header";
import BriefSection from "./components/brief-section";
import UnderstandingSection from "./components/understanding-section";
import ActiveSectionNav from "./active-section-nav";

export default function OneUtilityBankSite() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <article id="top">
          <BriefSection />
          <UnderstandingSection />
        </article>
      </main>
      <ActiveSectionNav />
    </div>
  );
}
