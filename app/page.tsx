import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Features } from "@/components/Features";
import { Roadmap } from "@/components/Roadmap";
import { ForTeachers } from "@/components/ForTeachers";
import { FAQ } from "@/components/FAQ";
import { AboutMaker } from "@/components/AboutMaker";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { alternates } from "@/lib/i18n/metadata";

export const metadata: Metadata = { alternates: alternates("vi", "/") };

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Roadmap />
        <ForTeachers />
        <FAQ />
        <AboutMaker />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
