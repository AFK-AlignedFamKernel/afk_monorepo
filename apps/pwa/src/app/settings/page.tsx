'use client';

import { NotificationsSettings } from '@/components/NotificationsSettings';
import { Navbar } from '../components/Navbar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <NotificationsSettings />
        </div>
      </div>
    </div>
  );
} 