import {Footer} from '../../components/Footer';
import {About} from '../../components/social_network/About';
import {ContributeSection} from '../../components/social_network/ContributeSection';
import {DescriptionSection} from '../../components/social_network/DescriptionSection';
import {DownloadSection} from '../../components/social_network/DownloadSection';
import {Faq} from '../../components/social_network/Faq';
import {HeroSection} from '../../components/social_network/HeroSection';
import {Navbar} from '../../components/Navbar';
import {Metadata} from 'next';
const metadata: Metadata = {
  title: 'AFK Social Network',
  description:
    'AFK Social Network is a decentralized social network where you own you identity and your data.',
};
export default function SocialNetworkPage() {
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
