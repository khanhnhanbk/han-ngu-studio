"use client";

import { useState } from "react";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Lead capture is not wired yet — this is a UI stub for future monetization.
    // TODO: POST to an API route / newsletter provider.
    setSubmitted(true);
  }

  return (
    <section id="cta" className="section">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #fb923c 0, transparent 40%), radial-gradient(circle at 80% 60%, #ea580c 0, transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {dict.cta.title}
            </h2>
            <p className="mt-4 text-white/80">{dict.cta.subtitle}</p>

            {submitted ? (
              <p className="mt-8 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white">
                Cảm ơn bạn! Chúng tôi sẽ liên hệ khi có tính năng mới. 🎉
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.cta.placeholder}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button type="submit" className="btn bg-white text-ink-900 hover:bg-white/90">
                  {dict.cta.button}
                </button>
              </form>
            )}

            <p className="mt-4 text-xs text-white/60">{dict.cta.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
