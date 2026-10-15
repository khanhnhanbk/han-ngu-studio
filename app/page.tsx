import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Features } from "@/components/Features";
import { Roadmap } from "@/components/Roadmap";
import { HowItWorks } from "@/components/HowItWorks";
import { ForTeachers } from "@/components/ForTeachers";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Roadmap />
        <HowItWorks />
        <ForTeachers />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
