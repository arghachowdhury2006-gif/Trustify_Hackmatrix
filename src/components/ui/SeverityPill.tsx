import React from 'react';
import { Severity } from '@/lib/types';

interface SeverityPillProps {
  severity: Severity;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ severity }) => {
  const styles: Record<Severity, string> = {
    low: 'bg-[#74B3A8]/20 text-[#213843] border-[#74B3A8]/50',
    medium: 'bg-[#FEAF76]/30 text-[#213843] border-[#FEAF76]/70',
    high: 'bg-[#DA6D58]/20 text-[#DA6D58] border-[#DA6D58]/50',
    critical: 'bg-[#DA6D58] text-white border-[#DA6D58] font-bold shadow-sm',
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
        styles[severity] || styles.low
      }`}
    >
      {severity}
    </span>
  );
};
