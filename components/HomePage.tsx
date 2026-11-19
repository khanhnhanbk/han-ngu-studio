import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { Features } from "./Features";
import { Roadmap } from "./Roadmap";
import { ForTeachers } from "./ForTeachers";
import { FAQ } from "./FAQ";
import { AboutMaker } from "./AboutMaker";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";

/** Landing page body, shared by / and /en (each adds its own structured data). */
export function HomePage() {
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
