import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface Question {
  text: string;
  answer: number;
  options: number[];
}

export const NumberChallengeGame: React.FC = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [totalAttempted, setTotalAttempted] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateQuestion = (): Question => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = 0;
    let num2 = 0;
    let ans = 0;

    if (op === '+') {
      num1 = Math.floor(Math.random() * 40) + 5;
      num2 = Math.floor(Math.random() * 40) + 5;
      ans = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * (num1 - 5)) + 1;
      ans = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      ans = num1 * num2;
    }

    // Generate 3 unique distractors near the actual answer
    const optionsSet = new Set<number>([ans]);
    while (optionsSet.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
      const fakeAns = ans + delta;
      if (fakeAns >= 0) optionsSet.add(fakeAns);
    }

    // Shuffle options
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
      text: `${num1} ${op === '*' ? '×' : op} ${num2}`,
      answer: ans,
      options,
    };
  };

  const loadNextQuestion = () => {
    setQuestion(generateQuestion());
    setFeedback(null);
  };

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const handleSelectOption = (selectedOption: number) => {
    if (!question || feedback !== null) return;

    setTotalAttempted((prev) => prev + 1);

    if (selectedOption === question.answer) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      loadNextQuestion();
    }, 600);
  };

  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setTotalAttempted(0);
    loadNextQuestion();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Telemetry */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-purple-400" /> Number Speed Sprint
          </h4>
          <p className="text-xs text-slate-400">Quickly solve arithmetic questions!</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            Score: <span className="text-emerald-400 font-mono">{score}</span> / {totalAttempted}
          </span>
          {streak >= 2 && (
            <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold animate-pulse">
              🔥 {streak} Streak!
            </span>
          )}
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Score"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Question Display */}
      {question && (
        <div className="space-y-4">
          <div
            className={clsx(
              'p-6 sm:p-8 rounded-2xl border text-center transition-colors duration-200 shadow-inner relative overflow-hidden',
              feedback === null && 'bg-slate-950 border-slate-800',
              feedback === 'correct' && 'bg-emerald-950/80 border-emerald-500/60',
              feedback === 'wrong' && 'bg-rose-950/80 border-rose-500/60'
            )}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Solve Problem
            </p>
            <p className="text-4xl sm:text-5xl font-black text-white tracking-wider font-mono">
              {question.text} = ?
            </p>

            {feedback === 'correct' && (
              <div className="absolute right-4 top-4 text-emerald-400 flex items-center gap-1 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-5 h-5" /> Correct!
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="absolute right-4 top-4 text-rose-400 flex items-center gap-1 text-xs font-bold animate-fadeIn">
                <XCircle className="w-5 h-5" /> Answer: {question.answer}
              </div>
            )}
          </div>

          {/* 4 Touch Choice Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={feedback !== null}
                className={clsx(
                  'py-4 px-6 rounded-2xl border text-xl font-bold font-mono transition-all duration-200 cursor-pointer min-h-[56px] shadow-sm',
                  feedback === null
                    ? 'bg-slate-900 hover:bg-indigo-600/90 border-slate-800 hover:border-indigo-500 text-slate-100 hover:text-white hover:shadow-indigo-500/20'
                    : option === question.answer
                    ? 'bg-emerald-600 border-emerald-400 text-white font-black scale-[1.02]'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
