"use client";

import { useState } from "react";

const FIELD =
  "w-full border-0 border-b border-white/60 bg-transparent px-0 py-3 font-sans text-[17px] text-white placeholder:text-white focus:border-white focus:outline-none";

const LABEL = "font-mono text-[11px] uppercase tracking-[0.16em] text-white";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mailto = `mailto:info@bbdowestafrica.com?subject=${encodeURIComponent(
    subject || `Enquiry from ${name || "the website"}`,
  )}&body=${encodeURIComponent(`${message}\n\n${name}\n${email}`)}`;

  return (
    <form
      className="flex flex-col gap-7 self-start"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = mailto;
      }}
    >
      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          required
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="contact-subject">
          Brand or brief
        </label>
        <input
          id="contact-subject"
          name="subject"
          placeholder="What it is about"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          placeholder="The problem and the deadline"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${FIELD} resize-y`}
        />
      </div>

      <button
        type="submit"
        className="mt-2 self-start bg-white px-9 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-foreground hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Send it
      </button>
    </form>
  );
}
