'use client';

import React from 'react';
import Cashu from '@/components/Cashu';

export default function WalletPage() {
  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Cashu Wallet</h1>
      <Cashu />
    </div>
  );
}
