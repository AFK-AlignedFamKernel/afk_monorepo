'use client';
import React from 'react';
// import MenuHomeComponent from '@/components/menu/MenuHome';
import { useAppStore } from '@/store/app';
import DiscoverComponent from '@/components/Discovery/Discover';
import OnboardingCheck from '@/components/Onboarding/OnboardingCheck';

// Use inline Layout to avoid type issues
export default function HomePage() {

  const { user, setUser } = useAppStore();
  return (
    <div className="content">
      <DiscoverComponent />
      <OnboardingCheck />
      {/* <MenuHomeComponent /> */}
    </div>
  );
}
