import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Brain, RotateCcw, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

const EMOJI_SET = ['🚀', '⚡', '🧠', '💎', '🎯', '🔥'];

interface CardItem {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatchGame: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const initializeGame = () => {
    const duplicated = [...EMOJI_SET, ...EMOJI_SET];
    // Shuffle
    const shuffled = duplicated
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setIsLocked(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // Update flipped status on card
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
        }, 400);
      } else {
        // Not a match, flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isWon = cards.length > 0 && cards.every((c) => c.isMatched);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-indigo-400" /> Memory Match Sprint
          </h4>
          <p className="text-xs text-slate-400">Match all 6 pairs to reset your mind!</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            Moves: <span className="text-indigo-400 font-mono">{moves}</span>
          </span>
          <button
            onClick={initializeGame}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 12 Cards */}
      {isWon ? (
        <div className="p-8 text-center bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3 animate-fadeIn">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
          <h4 className="text-xl font-black text-white">Memory Challenge Completed!</h4>
          <p className="text-xs text-slate-300">
            Solved in <span className="font-bold text-indigo-400">{moves} moves</span>. Your brain is primed for the next focus sprint.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={initializeGame} icon={<RotateCcw className="w-4 h-4" />}>
              Play Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {cards.map((card, index) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                disabled={card.isMatched}
                className={clsx(
                  'h-16 sm:h-20 rounded-2xl border text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 cursor-pointer select-none aspect-square',
                  card.isMatched
                    ? 'bg-emerald-950/60 border-emerald-500/40 opacity-70 scale-95 cursor-default'
                    : isRevealed
                    ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-600/20 rotate-0'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                )}
              >
                {isRevealed ? card.emoji : '?'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
