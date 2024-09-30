'use client';
import {AppRender} from 'pixel_ui';

import {NavbarPixel} from '../components/NavbarPixel';

export default function Pixel() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <NavbarPixel />
      {/* <App></App> */}

      {typeof window !== 'undefined' && <AppRender></AppRender>}
      {/* {typeof window !== 'undefined' && <App></App>} */}
      {/* <Footer /> */}
    </div>
  );
}
