import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  hasError?: boolean;
  className?: string;
  placeholder?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  hasError = false,
  className = '',
  placeholder,
}) => {
  const roundValue = (val: number): number => {
    // Avoid floating point inaccuracies for decimal steps
    return Math.round(val * 100) / 100;
  };

  const handleIncrement = () => {
    const nextVal = roundValue(Math.min(max, value + step));
    onChange(nextVal);
  };

  const handleDecrement = () => {
    const nextVal = roundValue(Math.max(min, value - step));
    onChange(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value === 0 ? '' : value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full pl-3 pr-7 py-1.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-colors font-mono ${
          hasError
            ? 'border-rose-500 text-rose-300'
            : 'border-zinc-800 hover:border-zinc-700 focus:border-amber-500/80'
        }`}
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center py-1">
        <button
          type="button"
          tabIndex={-1}
          onClick={handleIncrement}
          className="h-3 w-5 flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/80 active:text-amber-300 rounded transition-colors"
          title="Increment"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={handleDecrement}
          className="h-3 w-5 flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/80 active:text-amber-300 rounded transition-colors"
          title="Decrement"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
