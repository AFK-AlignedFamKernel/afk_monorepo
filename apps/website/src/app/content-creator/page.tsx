import {Metadata} from 'next';
import {Footer} from '../../components/Footer';
import {Navbar} from '../../components/Navbar';
import ContentCreatorPageComponent from '@/components/content-creator/page';
export const metadata: Metadata = {
  title: 'AFK - Content Creator',
  description:
    'AFK is the Content Creator platform — a decentralized marketplace for content, trends, and reputation across Bitcoin, Ethereum, and Starknet.',
};
export default function ContentCreatorPage() {
  return (
    <>
      <Navbar />
      <ContentCreatorPageComponent />
      <Footer></Footer>
    </>
  );
}
