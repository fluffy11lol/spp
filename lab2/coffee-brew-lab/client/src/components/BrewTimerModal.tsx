import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Droplets, Check } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface BrewTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

export const BrewTimerModal: React.FC<BrewTimerModalProps> = ({
  isOpen,
  onClose,
  recipe,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<any>(null);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback may be restricted until user interaction
    }
  };

  useEffect(() => {
    if (isRunning) {
      const targetTime = recipe?.brewTimeSeconds || 165;
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next === 1 || next === 46 || next === 91 || next === targetTime) {
            playChime();
          }
          if (next >= targetTime) {
            setIsRunning(false);
            return targetTime;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, recipe]);

  useEffect(() => {
    if (isOpen) {
      setSeconds(0);
      setIsRunning(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !recipe) return null;

  const totalTime = recipe.brewTimeSeconds || 165;
  const progressPercent = Math.min(100, Math.round((seconds / totalTime) * 100));

  let stageName = 'Preparation';
  let stageDesc = 'Rinse paper filter, add ground coffee and tare your scale.';
  let stageWater = '0 ml';

  const bloomEnd = 45;
  const firstPourEnd = 90;
  const bloomWater = Math.round(recipe.coffeeWeight * 3);
  const firstPourWater = Math.round(recipe.waterAmount * 0.6);

  if (seconds > 0 && seconds <= bloomEnd) {
    stageName = 'Blooming (Pre-infusion)';
    stageDesc = `Gently pour ${bloomWater}ml of water in spiral motions to saturate all coffee grounds.`;
    stageWater = `to ${bloomWater} ml`;
  } else if (seconds > bloomEnd && seconds <= firstPourEnd) {
    stageName = 'First Pour';
    stageDesc = `Pour evenly in concentric circles up to ${firstPourWater}ml.`;
    stageWater = `to ${firstPourWater} ml`;
  } else if (seconds > firstPourEnd && seconds < totalTime) {
    stageName = 'Final Pour & Drawdown';
    stageDesc = `Pour remaining water up to ${recipe.waterAmount}ml and allow the bed to draw down completely.`;
    stageWater = `to ${recipe.waterAmount} ml`;
  } else if (seconds >= totalTime) {
    stageName = 'Extraction Finished!';
    stageDesc = 'Remove the dripper, swirl the carafe to aerate, and enjoy your cup!';
    stageWater = `${recipe.waterAmount} ml`;
  }

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stages = [
    {
      id: 1,
      name: 'Blooming',
      range: `0:00 - ${formatTime(bloomEnd)}`,
      water: `to ${bloomWater} ml`,
      isActive: seconds > 0 && seconds <= bloomEnd,
      isDone: seconds > bloomEnd,
    },
    {
      id: 2,
      name: 'First Pour',
      range: `${formatTime(bloomEnd)} - ${formatTime(firstPourEnd)}`,
      water: `to ${firstPourWater} ml`,
      isActive: seconds > bloomEnd && seconds <= firstPourEnd,
      isDone: seconds > firstPourEnd,
    },
    {
      id: 3,
      name: 'Drawdown',
      range: `${formatTime(firstPourEnd)} - ${formatTime(totalTime)}`,
      water: `to ${recipe.waterAmount} ml`,
      isActive: seconds > firstPourEnd && seconds < totalTime,
      isDone: seconds >= totalTime,
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center overscroll-contain"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Recipe info badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
          <Droplets className="w-3.5 h-3.5" />
          <span>{recipe.method}</span>
          <span>•</span>
          <span>{recipe.waterTemperature}°C</span>
          <span>•</span>
          <span>{recipe.coffeeWeight}g / {recipe.waterAmount}ml</span>
        </div>

        <h3 className="text-lg font-bold text-zinc-100 mb-1">{recipe.title}</h3>
        <p className="text-xs text-zinc-400 mb-6">{recipe.roaster} • {recipe.origin}</p>

        {/* Timer Display */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-zinc-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-amber-500 transition-all duration-500 ease-out"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-extrabold tracking-tight font-mono text-zinc-100">
              {formatTime(seconds)}
            </span>
            <span className="text-xs text-zinc-500 mt-1 font-mono">
              target: {formatTime(totalTime)}
            </span>
          </div>
        </div>

        {/* Stages Timeline Overview */}
        <div className="grid grid-cols-3 gap-2 w-full mb-3">
          {stages.map((st) => (
            <div
              key={st.id}
              className={`p-2 rounded-xl text-left border transition-all ${
                st.isActive
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                  : st.isDone
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-zinc-500">{st.range}</span>
                {st.isDone && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
              </div>
              <div
                className={`text-xs font-bold truncate ${
                  st.isActive ? 'text-amber-400' : st.isDone ? 'text-zinc-200' : 'text-zinc-300'
                }`}
              >
                {st.name}
              </div>
              <div className="text-[11px] font-mono text-zinc-500">{st.water}</div>
            </div>
          ))}
        </div>

        {/* Step Info Card */}
        <div className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 mb-6 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {stageName}
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {stageWater}
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{stageDesc}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSeconds(0);
              setIsRunning(false);
            }}
            className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all active:scale-95"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (seconds >= totalTime) {
                setSeconds(0);
                setIsRunning(true);
              } else {
                setIsRunning(!isRunning);
              }
            }}
            className={`px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-zinc-950 ${
              isRunning
                ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20'
                : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>{seconds >= totalTime ? 'Brew Again' : seconds === 0 ? 'Start' : 'Resume'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
