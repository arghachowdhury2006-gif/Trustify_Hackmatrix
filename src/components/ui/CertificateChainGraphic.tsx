import React from 'react';
import { CertNode } from '@/lib/types';
import { ShieldCheck, ShieldAlert, ArrowDown } from 'lucide-react';

interface CertificateChainGraphicProps {
  chain?: CertNode[];
  valid?: boolean;
}

export const CertificateChainGraphic: React.FC<CertificateChainGraphicProps> = ({
  chain = [],
  valid = true,
}) => {
  if (!chain || chain.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-ink-60">
        No certificate chain data available.
      </div>
    );
  }

  // Display hierarchy: Root at top, Intermediate in middle, Leaf at bottom
  const orderedChain = [...chain].reverse();

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto py-2">
      {orderedChain.map((node, index) => {
        const isLeaf = node.role === 'leaf';
        const isRoot = node.role === 'root';
        const isTrusted = node.trusted !== false;

        return (
          <React.Fragment key={index}>
            <div
              className={`w-full rounded-2xl p-4 border transition-all ${
                isLeaf
                  ? valid
                    ? 'bg-[#FBEBDA] border-[#468D8B] shadow-sm'
                    : 'bg-[#FBEBDA] border-[#DA6D58] shadow-sm'
                  : 'bg-[#FBEBDA]/70 border-[#E8C9AA]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isTrusted
                        ? 'bg-[#468D8B]/20 text-[#468D8B]'
                        : 'bg-[#DA6D58]/20 text-[#DA6D58]'
                    }`}
                  >
                    {isRoot ? 'R' : isLeaf ? 'L' : 'I'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-60 block">
                      {isRoot ? 'Root CA' : isLeaf ? 'End-Entity (Leaf)' : 'Intermediate CA'}
                    </span>
                    <h4 className="text-sm font-semibold text-ink truncate max-w-xs md:max-w-sm">
                      {node.subject}
                    </h4>
                  </div>
                </div>

                <div>
                  {isTrusted ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#468D8B] font-medium bg-[#74B3A8]/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={14} />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-[#DA6D58] font-medium bg-[#DA6D58]/20 px-2 py-0.5 rounded-full">
                      <ShieldAlert size={14} />
                      Untrusted
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#E8C9AA]/50 flex flex-wrap items-center justify-between text-xs text-ink-60 gap-2 font-mono">
                <span>{node.key || 'RSA 2048'}</span>
                <span>{node.sigAlg || 'sha256WithRSA'}</span>
                {node.validTo && (
                  <span className="text-[11px]">
                    Expires: {new Date(node.validTo).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {index < orderedChain.length - 1 && (
              <div className="flex items-center justify-center text-[#468D8B]">
                <ArrowDown size={18} className="animate-bounce" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

