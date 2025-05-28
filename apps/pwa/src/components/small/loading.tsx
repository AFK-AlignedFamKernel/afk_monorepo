"use client";

import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    </div>
  );
};

export default Loading; 