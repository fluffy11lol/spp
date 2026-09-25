import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-rose-500 focus:ring-rose-500/40 text-rose-300'
            : isOpen
            ? 'border-amber-500/80 ring-2 ring-amber-500/30 text-zinc-100'
            : 'border-zinc-800 hover:border-zinc-700 text-zinc-200 focus:border-amber-500/80 focus:ring-amber-500/30'
        }`}
      >
        <span className={selectedOption ? 'text-zinc-100' : 'text-zinc-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 max-h-60 overflow-y-auto overscroll-contain backdrop-blur-md">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                  isSelected
                    ? 'bg-amber-500/10 text-amber-400 font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
