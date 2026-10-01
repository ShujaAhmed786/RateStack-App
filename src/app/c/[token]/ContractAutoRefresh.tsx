'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface MilestoneLike {
  id: string;
  status: string | any;
}

interface ContractAutoRefreshProps {
  token: string;
  initialStatus?: string | null;
  initialMilestones?: MilestoneLike[];
}

export default function ContractAutoRefresh({
  token,
  initialStatus = '',
  initialMilestones = [],
}: ContractAutoRefreshProps) {
  const router = useRouter();

  // Create a fingerprint of all milestone statuses combined
  const getFingerprint = (status?: string | null, milestones?: MilestoneLike[]) => {
    const milestonePart = (milestones || [])
      .map((m) => `${m.id}:${String(m.status)}`)
      .join('|');
    return `${status || ''}__${milestonePart}`;
  };

  const lastFingerprintRef = useRef(getFingerprint(initialStatus, initialMilestones));

  // Sync ref whenever props change after a router.refresh()
  useEffect(() => {
    lastFingerprintRef.current = getFingerprint(initialStatus, initialMilestones);
  }, [initialStatus, initialMilestones]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/contracts/status?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!data || !data.milestones) return;

        const currentFingerprint = getFingerprint(data.status, data.milestones);

        // If seller confirmed payment or status changed, refresh the server component
        if (currentFingerprint !== lastFingerprintRef.current) {
          lastFingerprintRef.current = currentFingerprint;
          router.refresh();
        }
      } catch (err) {
        // Silently catch background poll glitches
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [token, router]);

  return null;
}