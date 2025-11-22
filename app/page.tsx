import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Statistics from '@/components/Statistics';
import About from '@/components/About';
import Services from '@/components/Services';
import Partnerships from '@/components/Partnerships';
import ResearchSection from '@/components/ResearchSection';
import Expertise from '@/components/Expertise';
import Contact from '@/components/Contact';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Statistics />
        <About />
        <Services />
        <Partnerships />
        <ResearchSection />
        <Expertise />
        <Contact />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
