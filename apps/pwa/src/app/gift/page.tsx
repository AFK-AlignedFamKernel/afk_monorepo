'use client';
import {AppRender} from 'pixel_ui';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import SendGiftForm from '../components/gift/SendGiftForm';


export default function Gift() {
  return (
    <div className="min-h-screen w-full relative bg-black">

      <Navbar></Navbar>
      <SendGiftForm></SendGiftForm>

      <Footer/>
    </div>
  );
}
