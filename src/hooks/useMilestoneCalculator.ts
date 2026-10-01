'use client';

import { useState, useMemo } from 'react';

export interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  amount: number;
  dueDate?: string;
}

export function useMilestoneCalculator(initialTotalValue: number = 1000) {
  const [totalValue, setTotalValue] = useState<number>(initialTotalValue);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    {
      id: 'ms-1',
      title: 'Milestone 1: Deposit & Project Initiation',
      description: 'Initial planning, scope lock, and repository setup.',
      percentage: 50,
      amount: Math.round((initialTotalValue * 50) / 100),
      dueDate: '',
    },
    {
      id: 'ms-2',
      title: 'Milestone 2: Final Delivery & Handover',
      description: 'Full deployment, acceptance testing, and documentation handover.',
      percentage: 50,
      amount: Math.round((initialTotalValue * 50) / 100),
      dueDate: '',
    },
  ]);

  const addMilestone = () => {
    const newId = `ms-${Date.now()}`;
    const newCount = milestones.length + 1;
    const evenPct = Math.floor(100 / newCount);

    const updated = milestones.map((m) => ({
      ...m,
      percentage: evenPct,
      amount: Math.round((totalValue * evenPct) / 100),
    }));

    const allocated = evenPct * (newCount - 1);
    const lastPct = 100 - allocated;

    updated.push({
      id: newId,
      title: `Milestone ${newCount}`,
      description: '',
      percentage: lastPct,
      amount: Math.round((totalValue * lastPct) / 100),
      dueDate: '',
    });

    setMilestones(updated);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    const remaining = milestones.filter((m) => m.id !== id);
    const evenPct = Math.floor(100 / remaining.length);

    const rebalanced = remaining.map((m, idx) => {
      const pct = idx === remaining.length - 1 ? 100 - evenPct * (remaining.length - 1) : evenPct;
      return {
        ...m,
        percentage: pct,
        amount: Math.round((totalValue * pct) / 100),
      };
    });

    setMilestones(rebalanced);
  };

  const updateMilestoneField = (id: string, field: keyof MilestoneItem, value: any) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;

        if (field === 'percentage') {
          const numPct = Number(value) || 0;
          return {
            ...m,
            percentage: numPct,
            amount: Math.round((totalValue * numPct) / 100),
          };
        }

        return { ...m, [field]: value };
      })
    );
  };

  const rebalanceEvenly = () => {
    if (milestones.length === 0) return;
    const count = milestones.length;
    const evenPct = Math.floor(100 / count);

    const updated = milestones.map((m, idx) => {
      const pct = idx === count - 1 ? 100 - evenPct * (count - 1) : evenPct;
      return {
        ...m,
        percentage: pct,
        amount: Math.round((totalValue * pct) / 100),
      };
    });

    setMilestones(updated);
  };

  const totalPercentage = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
  }, [milestones]);

  const allocatedAmount = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  return {
    totalValue,
    setTotalValue,
    milestones,
    setMilestones,
    addMilestone,
    removeMilestone,
    updateMilestoneField,
    rebalanceEvenly,
    totalPercentage,
    allocatedAmount,
  };
}