import React, { useState } from 'react';
import { QuickReactionGame } from './QuickReactionGame';
import { MemoryMatchGame } from './MemoryMatchGame';
import { NumberChallengeGame } from './NumberChallengeGame';
import { Card } from '../../ui/Card';
import { Gamepad2, Zap, Brain, Calculator, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

type SelectedGame = 'reaction' | 'memory' | 'numbers';

export const BreakGames: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>('reaction');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <Card className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 space-y-4">
      {/* Header & Collapse / Skip Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20 shrink-0">
            <Gamepad2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Pomodoro Break Mini-Games</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Optional 1–5m Rest
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Refresh your brain with quick frontend challenges during rest intervals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          {isExpanded ? (
            <>
              <span>Skip Game / Back to Break</span>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </>
          ) : (
            <>
              <span>🎮 Open Break Games</span>
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fadeIn">
          {/* Game Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedGame('reaction')}
              className={clsx(
                'py-2 px-1.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]',
                selectedGame === 'reaction'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden min-[360px]:block" />
              <span className="truncate">Quick Reaction</span>
            </button>

            <button
              onClick={() => setSelectedGame('memory')}
              className={clsx(
                'py-2 px-1.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]',
                selectedGame === 'memory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Brain className="w-3.5 h-3.5 text-sky-400 shrink-0 hidden min-[360px]:block" />
              <span className="truncate">Memory Match</span>
            </button>

            <button
              onClick={() => setSelectedGame('numbers')}
              className={clsx(
                'py-2 px-1.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]',
                selectedGame === 'numbers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Calculator className="w-3.5 h-3.5 text-purple-400 shrink-0 hidden min-[360px]:block" />
              <span className="truncate">Number Sprint</span>
            </button>
          </div>

          {/* Active Mini-Game View */}
          <div className="pt-2">
            {selectedGame === 'reaction' && <QuickReactionGame />}
            {selectedGame === 'memory' && <MemoryMatchGame />}
            {selectedGame === 'numbers' && <NumberChallengeGame />}
          </div>
        </div>
      )}
    </Card>
  );
};
