'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import LaunchpadDetailPage from '../../../components/launchpad/LaunchDetail';

export default function LaunchpadAddressPage() {
  const { address } = useParams()
  return (
    <LaunchpadDetailPage address={address as string} />
  )
} 