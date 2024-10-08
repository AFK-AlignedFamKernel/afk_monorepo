'use client';
import {Navbar} from './components/Navbar';
import {AppRender} from 'pixel_ui';

export default function App() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      {typeof window !== 'undefined' && <AppRender></AppRender>}
      {/* <Footer /> */}
    </div>
  );
}
