'use client';

import React from 'react';

export default function ResponsiveLayoutPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Responsive Layout Demo</h1>
      <p className="mb-4">This page demonstrates our beautifully designed responsive layout with:</p>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Theme Support</h2>
        <p className="mb-4">
          The layout automatically adapts to dark and light modes. Toggle between themes using:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">The sun/moon icon in the mobile header (on small screens)</li>
          <li className="mb-2">The sun/moon icon in the sidebar footer (on desktop)</li>
        </ul>
        <p>
          Your theme preference is saved to localStorage and will persist between visits.
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Responsive Features</h2>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Desktop View:</strong> Fixed sidebar with main content shifted to the right</li>
          <li className="mb-2"><strong>Mobile View:</strong> Full-width content with a hamburger menu that reveals the sidebar</li>
          <li className="mb-2"><strong>Hidden scrollbars:</strong> Clean UI with custom-styled scrollable areas</li>
          <li className="mb-2"><strong>Adaptive colors:</strong> All elements use CSS variables for consistent theming</li>
        </ul>
        <p>
          Try resizing your browser window to see how the layout adapts to different screen sizes.
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Implementation Details</h2>
        <p className="mb-4">
          This layout is built with:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Modern CSS features (variables, flexbox, grid)</li>
          <li className="mb-2">SCSS for style organization</li>
          <li className="mb-2">React hooks for state management</li>
          <li className="mb-2">Mobile-first responsive design</li>
        </ul>
        <p>
          The sidebar transitions smoothly and the theme changes apply instantly across all components.
        </p>
      </div>
    </>
  );
} 