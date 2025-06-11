'use client';
import React from 'react';
import MenuHomeComponent from '@/components/menu/MenuHome';
import { useAppStore } from '@/store/app';

// Use inline Layout to avoid type issues
export default function HomePage() {

  const { user, setUser } = useAppStore();
  return (
    <div className="content">
      <MenuHomeComponent />
    </div>
  );
}
