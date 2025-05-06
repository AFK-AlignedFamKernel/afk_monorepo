'use client';

import React from 'react';

// Use inline Layout to avoid type issues
export default function HomePage() {
  return (
    <div className="content">
      <h1 className="text-2xl font-bold mb-4">Welcome to AFK</h1>
      <p className="mb-4">This is the main content of the home page.</p>
      <p className="mb-4">You can add more content here.</p>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Responsive Layout Demo</h2>
        <p className="mb-2">Check out our responsive layout with mobile drawer and desktop sidebar.</p>
        <a 
          href="/responsive-layout" 
          className="sidebar-nav-item"
        >
          View Demo
        </a>
      </div>
    </div>
  );
}
