import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  // Colors per PRD tokens
  let strokeColor = '#468D8B'; // Teal (Safe)
  let textColor = '#213843';
  let statusText = 'Safe';

  if (score < 50) {
    strokeColor = '#DA6D58'; // Coral (Malicious)
    statusText = 'Malicious';
  } else if (score < 80) {
    strokeColor = '#FEAF76'; // Peach (Suspicious)
    statusText = 'Suspicious';
  }

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(33, 56, 67, 0.15)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-extrabold tracking-tight" style={{ color: strokeColor }}>
          {score}
        </span>
        <span className="text-[10px] uppercase font-semibold text-ink-60 tracking-wider">
          Score
        </span>
      </div>
      {showLabel && (
        <span
          className="mt-2 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${strokeColor}22`,
            color: strokeColor,
          }}
        >
          {statusText}
        </span>
      )}
    </div>
  );
};
