import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const CLIENTS = [
  ["Google", "/clients/google.png"],
  ["Wrigley’s", "/clients/wrigleys.png"],
  ["YouTube", "/clients/youtube.png"],
  ["Visa", "/clients/visa.png"],
  ["Malta Guinness", "/clients/malta.png"],
  ["Kellogg’s", "/clients/kelloggs.png"],
  ["Guinness", "/clients/guinness.png"],
  ["Johnson’s", "/clients/johnsons.png"],
  ["Kate’s", "/clients/kates.png"],
  ["YouTube Go", "/clients/youtube-go.png"],
  ["Android One", "/clients/android-one.png"],
  ["RenMoney", "/clients/ren-money.png"],
  ["Ensure Insurance", "/clients/ensure-insurance.png"],
  ["Fidelity", "/clients/fidelity.png"],
  ["Doobai", "/clients/doobai.png"],
] as const;

export default function ClientsPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">The people we build with</p>
          <h1 className="mt-10 max-w-[8ch] text-[clamp(64px,15vw,208px)] uppercase leading-[0.82] tracking-[-0.06em]">
            Clients.
          </h1>
        </section>

        <section className="px-[clamp(20px,5vw,72px)] py-[clamp(52px,8vw,112px)]">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-foreground pb-5">
            <h2 className="m-0 max-w-[12ch] text-[clamp(34px,5vw,72px)] uppercase leading-[0.9] tracking-[-0.05em]">
              Strong partnerships make stronger work.
            </h2>
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Our client mix</p>
          </div>

          <div className="mt-10 grid grid-cols-2 border-l border-t border-foreground/20 sm:grid-cols-3 lg:grid-cols-5">
            {CLIENTS.map(([name, src]) => (
              <div key={name} className="flex min-h-36 items-center justify-center border-b border-r border-foreground/20 p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={name} className="max-h-20 max-w-full object-contain" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
