"use client";

import React from 'react';

const CryptoLoading: React.FC = () => {
  return (
    <div className="loading-overlay">
      <div className="crypto-loader">
        <div className="blockchain"></div>
        <div className="privacy"></div>
      </div>
    </div>
  );
};

export default CryptoLoading;