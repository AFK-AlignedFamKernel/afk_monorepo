import {Footer} from '../../components/Footer';
import {ContributeSection} from '../../components/all_in_one/ContributeSection';
import {DescriptionSection} from '../../components/all_in_one/DescriptionSection';
import {Navbar} from '../../components/Navbar';

export default function Features() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      <DescriptionSection />
      <div className="flex flex-col desktop:gap-y-[80px] gap-y-[50px] mt-[50px] desktop:mt-[180px]">
        <ContributeSection />
      </div>
      <Footer />
    </div>
  );
}
