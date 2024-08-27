"use client";
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { App, AppRender } from "pixel_ui"

export default function Pixel() {
  return (
    <div
      className="min-h-screen w-full relative bg-black"
    >
      <Navbar />
      {/* <App></App> */}
      <AppRender></AppRender>
      <Footer />
    </div>
  );
}
