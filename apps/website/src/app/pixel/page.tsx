'use client';
import {AppRender} from 'pixel_ui';

import {Footer} from '../components/Footer';
import {Navbar} from '../components/Navbar';

export default function Pixel() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      {/* <App></App> */}
      <AppRender></AppRender>
      <Footer />
    </div>
  );
}
