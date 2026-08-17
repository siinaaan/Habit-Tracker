import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Zap, Award, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'early';

export const QuickReactionGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTest = () => {
    setGameState('waiting');
    setReactionTime(null);

    // Random delay between 1.5s and 4.5s
    const delay = Math.floor(Math.random() * 3000) + 1500;

    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setGameState('ready');
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState('early');
    } else if (gameState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      setGameState('result');
      setHistory((prev) => [elapsed, ...prev.slice(0, 4)]);
      setBestTime((prev) => (prev === null || elapsed < prev ? elapsed : prev));
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Quick Reaction Speed
          </h4>
          <p className="text-xs text-slate-400">
            Tap or click as fast as possible when the box turns GREEN!
          </p>
        </div>

        {bestTime !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0">
            <Award className="w-3.5 h-3.5" /> Best: {bestTime} ms
          </div>
        )}
      </div>

      {/* Interactive Tap Area */}
      <div
        onClick={gameState === 'waiting' || gameState === 'ready' ? handleTap : undefined}
        className={clsx(
          'w-full h-48 sm:h-56 rounded-2xl border flex flex-col items-center justify-center p-6 text-center select-none transition-colors duration-200 cursor-pointer shadow-inner',
          gameState === 'idle' && 'bg-slate-950 border-slate-800 text-slate-300',
          gameState === 'waiting' && 'bg-rose-950/70 border-rose-500/40 text-rose-200 animate-pulse',
          gameState === 'ready' && 'bg-emerald-600 border-emerald-400 text-white font-black scale-[1.01]',
          gameState === 'early' && 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          gameState === 'result' && 'bg-slate-900 border-indigo-500/50 text-slate-100'
        )}
      >
        {gameState === 'idle' && (
          <div className="space-y-3">
            <Zap className="w-10 h-10 mx-auto text-amber-400 animate-bounce" />
            <div>
              <p className="text-base font-black">Ready to test your reflexes?</p>
              <p className="text-xs text-slate-400 mt-1">Press Start below to begin</p>
            </div>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="space-y-2">
            <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping mx-auto" />
            <p className="text-lg font-black tracking-wide">WAIT FOR GREEN...</p>
            <p className="text-xs opacity-75">Don't tap yet!</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black uppercase tracking-wider">TAP NOW!</p>
          </div>
        )}

        {gameState === 'early' && (
          <div className="space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-base font-black">Too Early!</p>
            <p className="text-xs opacity-80">You tapped before the screen turned green.</p>
          </div>
        )}

        {gameState === 'result' && reactionTime !== null && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reaction Time</p>
            <p className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">
              {reactionTime} <span className="text-lg font-normal text-slate-300">ms</span>
            </p>
            <p className="text-xs text-slate-400 pt-1">
              {reactionTime < 200
                ? '⚡ Lightning speed reflexes!'
                : reactionTime < 300
                ? '🎯 Great reaction time!'
                : '👍 Solid performance!'}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons & History */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {(gameState === 'idle' || gameState === 'result' || gameState === 'early') && (
          <Button
            onClick={startTest}
            variant="primary"
            className="w-full sm:w-auto"
            icon={<Zap className="w-4 h-4" />}
          >
            {gameState === 'idle' ? 'Start Test' : 'Try Again'}
          </Button>
        )}

        {history.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto py-1">
            <span className="font-bold text-slate-500">Recent:</span>
            {history.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
              >
                {t}ms
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
