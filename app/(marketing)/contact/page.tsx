import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContactForm } from "@/app/contact-form";

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">Start a conversation</p>
          <h1 className="mt-10 max-w-[8ch] text-[clamp(64px,15vw,208px)] uppercase leading-[0.82] tracking-[-0.06em]">
            Contact.
          </h1>
        </section>

        <section className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-x-[clamp(28px,7vw,112px)] gap-y-12 px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)] max-[820px]:grid-cols-1">
          <div>
            <h2 className="m-0 max-w-[11ch] text-[clamp(38px,5.2vw,76px)] uppercase leading-[0.9] tracking-[-0.05em]">
              Hen’s teeth are hard to find. We are not.
            </h2>
            <p className="mt-8 max-w-[30ch] text-[20px] leading-[1.35]">
              Get in touch. We’re always a stone-throw away. If you throw us a mail.
            </p>

            <address className="mt-12 not-italic text-[18px] leading-[1.5]">
              <p className="m-0 max-w-[25ch]">Plot 5, Chief Yesufu Abiodun Oniru Road, Victoria Island, Lagos, Nigeria.</p>
              <a href="mailto:info@bbdowestafrica.com" className="mt-6 inline-block text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                info@bbdowestafrica.com
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=BBDO+West+Africa+Plot+5+Chief+Yesufu+Abiodun+Oniru+Road+Lagos"
                target="_blank"
                rel="noreferrer"
                className="mt-5 block font-mono text-[11px] uppercase tracking-[0.16em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                Open map ↗
              </a>
            </address>
          </div>

          <div className="bg-primary p-[clamp(24px,5vw,64px)] text-white">
            <h2 className="m-0 text-[clamp(30px,4vw,56px)] uppercase leading-[0.92] tracking-[-0.05em]">Tell us what’s moving.</h2>
            <p className="mb-10 mt-5 max-w-[36ch] text-[16px] leading-[1.5] text-white/85">
              Give us the brief, the business problem, or just the beginning of an idea.
            </p>
            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
