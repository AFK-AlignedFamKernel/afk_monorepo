import { AboutUs } from '@/components/all_in_one/AboutUs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AFK - About Us',
  description: 'AFK is a all-in-one app for your Ownership & Freedom.',
};  
export default function AboutPage() {
  return <AboutUs />;
}