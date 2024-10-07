'use client';

import {Footer} from '../components/Footer';
import {About} from '../components/landing/About';
import {ContributeSection} from '../components/landing/ContributeSection';
import {DescriptionSection} from '../components/landing/DescriptionSection';
import {DownloadSection} from '../components/landing/DownloadSection';
import {Faq} from '../components/landing/Faq';
import {HeroSection} from '../components/landing/HeroSection';
import {Navbar} from '../components/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      <HeroSection />
      <About />
      <DescriptionSection />
      <div className="flex flex-col desktop:gap-y-[80px] gap-y-[50px] mt-[50px] desktop:mt-[180px]">
        <ContributeSection />
        <DownloadSection />
        <Faq />
      </div>
      <Footer />
    </div>
  );
}
