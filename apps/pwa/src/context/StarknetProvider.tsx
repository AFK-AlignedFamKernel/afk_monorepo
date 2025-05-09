'use client';

import React from 'react';
import { StarknetProvider as StarknetProviderComponent } from '../providers/StarknetProviders';

export default function StarknetProvider({ children }: { children: React.ReactNode }) {
  return <StarknetProviderComponent>{children}</StarknetProviderComponent>;
} 