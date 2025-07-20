import {Footer} from '../components/Footer';
import {About} from '../components/all_in_one/About';
import {ContributeSection} from '../components/all_in_one/ContributeSection';
import {DescriptionSection} from '../components/all_in_one/DescriptionSection';
import {DownloadSection} from '../components/all_in_one/DownloadSection';
import {Faq} from '../components/all_in_one/Faq';
import {HeroSection} from '../components/all_in_one/HeroSection';
import {Navbar} from '../components/Navbar';
import {Metadata} from 'next';
const metadata: Metadata = {
  title: 'AFK Aligned Fam Kernel',
  description:
    'AFK is your all-in-one decentralized platform — combining social, payments, identity, and privacy into a seamless and sovereign experience.',
};
export default function App() {
  return (
    <div className="min-h-screen w-full relative">
      <Navbar />
      <HeroSection />
      <About />
      <DescriptionSection />
      <div className="flex flex-col desktop:gap-y-[80px] gap-y-[50px] mt-[10px]">
        <ContributeSection />
        <DownloadSection />
        <Faq />
      </div>
      <Footer />
    </div>
  );
}
