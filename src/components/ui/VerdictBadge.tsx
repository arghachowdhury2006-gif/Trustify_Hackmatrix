import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';
import { Verdict } from '@/lib/types';

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const configs = {
    safe: {
      label: 'Safe',
      icon: ShieldCheck,
      bg: 'bg-[#74B3A8]/25',
      text: 'text-[#213843]',
      border: 'border-[#468D8B]/40',
      iconColor: 'text-[#468D8B]',
    },
    suspicious: {
      label: 'Suspicious',
      icon: ShieldAlert,
      bg: 'bg-[#FEAF76]/30',
      text: 'text-[#213843]',
      border: 'border-[#FEAF76]/60',
      iconColor: 'text-[#DA6D58]',
    },
    malicious: {
      label: 'Malicious',
      icon: ShieldX,
      bg: 'bg-[#DA6D58]/20',
      text: 'text-[#DA6D58]',
      border: 'border-[#DA6D58]/50',
      iconColor: 'text-[#DA6D58]',
    },
    unknown: {
      label: 'Unknown',
      icon: HelpCircle,
      bg: 'bg-gray-200',
      text: 'text-gray-700',
      border: 'border-gray-300',
      iconColor: 'text-gray-500',
    },
  };

  const config = configs[verdict] || configs.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-bold',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-btn border ${config.bg} ${config.text} ${config.border} ${sizeClasses} transition-all`}
    >
      <Icon size={iconSizes} className={config.iconColor} />
      <span>{config.label}</span>
    </span>
  );
};
