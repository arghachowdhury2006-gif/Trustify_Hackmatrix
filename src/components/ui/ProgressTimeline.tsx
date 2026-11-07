import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface ScanStage {
  id: string;
  label: string;
  state: 'pending' | 'running' | 'completed';
}

interface ProgressTimelineProps {
  stages: ScanStage[];
  currentProgress?: number; // 0.0 - 1.0
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  stages,
  currentProgress = 0,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto py-4">
      {/* Overall Progress Bar */}
      <div className="w-full bg-[#E8C9AA]/40 h-2 rounded-full overflow-hidden mb-6">
        <div
          className="bg-[#468D8B] h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.round(currentProgress * 100)}%` }}
        />
      </div>

      {/* Stepper items */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const isDone = stage.state === 'completed';
          const isRunning = stage.state === 'running';

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isRunning
                  ? 'bg-[#FBEBDA] border border-[#468D8B]/40 shadow-sm'
                  : isDone
                  ? 'bg-[#FBEBDA]/50'
                  : 'opacity-50'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 size={20} className="text-[#468D8B]" />
                ) : isRunning ? (
                  <Loader2 size={20} className="text-[#468D8B] animate-spin" />
                ) : (
                  <Circle size={20} className="text-ink-60" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${isDone ? 'text-ink' : isRunning ? 'text-[#468D8B] font-semibold' : 'text-ink-60'}`}>
                  {stage.label}
                </span>
              </div>
              <div>
                <span className="text-xs text-ink-60 font-mono">
                  {isDone ? 'OK' : isRunning ? 'Analyzing...' : 'Queued'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
