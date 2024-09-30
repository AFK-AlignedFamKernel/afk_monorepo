'use client';

import { AppRender } from 'pixel_ui';
import {Footer} from './components/Footer';
import {About} from './components/landing/About';
import {ContributeSection} from './components/landing/ContributeSection';
import {DescriptionSection} from './components/landing/DescriptionSection';
import {DownloadSection} from './components/landing/DownloadSection';
import {Faq} from './components/landing/Faq';
import {HeroSection} from './components/landing/HeroSection';
import {Navbar} from './components/Navbar';
import { NavbarPixel } from './components/NavbarPixel';

export default function App() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      {typeof window !== 'undefined' && <AppRender></AppRender>}
      {/* <Footer /> */}
    </div>
  );
}
