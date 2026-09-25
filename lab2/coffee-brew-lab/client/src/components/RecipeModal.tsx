import React, { useState, useEffect } from 'react';
import { X, Scale, Coffee, AlertCircle, Star } from 'lucide-react';
import type { Recipe, BrewMethod } from '../types/recipe';
import { FileUpload } from './FileUpload';
import { NumberInput } from './NumberInput';
import { CustomSelect } from './CustomSelect';
import { SensoryControl } from './SensoryControl';

const METHODS: BrewMethod[] = [
  'V60',
  'Aeropress',
  'Chemex',
  'Origami',
  'Espresso',
  'French Press',
  'Cold Brew',
  'Clever',
];

const PRESET_DESCRIPTORS = [
  'Bergamot',
  'Jasmine',
  'White Peach',
  'Blackcurrant',
  'Pink Grapefruit',
  'Dark Chocolate',
  'Caramel',
  'Wild Strawberry',
  'Ripe Plum',
];

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: Recipe | null;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [roaster, setRoaster] = useState('');
  const [origin, setOrigin] = useState('');
  const [method, setMethod] = useState<BrewMethod>('V60');
  const [coffeeWeight, setCoffeeWeight] = useState<number>(15);
  const [waterAmount, setWaterAmount] = useState<number>(250);
  const [waterTemperature, setWaterTemperature] = useState<number>(93);
  const [grindSize, setGrindSize] = useState('');
  const [brewTimeSeconds, setBrewTimeSeconds] = useState<number>(165);
  const [rating, setRating] = useState<number>(5);
  const [acidity, setAcidity] = useState<number>(3);
  const [sweetness, setSweetness] = useState<number>(3);
  const [body, setBody] = useState<number>(3);
  const [tastingNotes, setTastingNotes] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [processingMethod, setProcessingMethod] = useState('Washed');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setRoaster(initialData.roaster);
      setOrigin(initialData.origin || 'Single Origin');
      setMethod(initialData.method);
      setCoffeeWeight(initialData.coffeeWeight);
      setWaterAmount(initialData.waterAmount);
      setWaterTemperature(initialData.waterTemperature);
      setGrindSize(initialData.grindSize);
      setBrewTimeSeconds(initialData.brewTimeSeconds);
      setRating(initialData.rating);
      setAcidity(initialData.acidity);
      setSweetness(initialData.sweetness);
      setBody(initialData.body);
      setTastingNotes(initialData.tastingNotes || []);
      setProcessingMethod(initialData.processingMethod || 'Washed');
    } else {
      setTitle('');
      setRoaster('');
      setOrigin('Single Origin');
      setMethod('V60');
      setCoffeeWeight(15);
      setWaterAmount(250);
      setWaterTemperature(93);
      setGrindSize('18 clicks (Comandante C40)');
      setBrewTimeSeconds(165);
      setRating(5);
      setAcidity(3);
      setSweetness(3);
      setBody(3);
      setTastingNotes(['Bergamot', 'Peach']);
      setProcessingMethod('Washed');
    }
    setSelectedFile(null);
    setFieldErrors({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

  const applyRatio = (ratio: number) => {
    const calculatedWater = Math.round(coffeeWeight * ratio);
    setWaterAmount(calculatedWater);
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tastingNotes.includes(trimmed)) {
      setTastingNotes([...tastingNotes, trimmed]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTastingNotes(tastingNotes.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('roaster', roaster.trim());
    fd.append('origin', origin.trim() || 'Single Origin');
    fd.append('method', method);
    fd.append('coffeeWeight', String(coffeeWeight));
    fd.append('waterAmount', String(waterAmount));
    fd.append('waterTemperature', String(waterTemperature));
    fd.append('grindSize', grindSize.trim() || 'Medium');
    fd.append('brewTimeSeconds', String(brewTimeSeconds));
    fd.append('rating', String(rating));
    fd.append('acidity', String(acidity));
    fd.append('sweetness', String(sweetness));
    fd.append('body', String(body));
    fd.append('tastingNotes', JSON.stringify(tastingNotes));
    fd.append('processingMethod', processingMethod);

    if (selectedFile) {
      fd.append('file', selectedFile);
    } else if (initialData?.imageUrl) {
      fd.append('imageUrl', initialData.imageUrl);
    }

    try {
      await onSubmit(fd);
      onClose();
    } catch (err: any) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      } else {
        setFieldErrors({ general: err.message || 'Validation error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black/80 backdrop-blur-sm overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-zinc-100">
              {initialData ? 'Edit Brew Recipe' : 'New Coffee Recipe'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
          {/* Validation Alert Banner */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-300 mb-1">
                  Please resolve the following input issues:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-200/90">
                  {Object.entries(fieldErrors).map(([field, msg]) => (
                    <li key={field}>
                      <span className="font-semibold capitalize">{field}:</span> {msg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* File Upload */}
          <FileUpload
            currentImageUrl={initialData?.imageUrl}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            error={fieldErrors.imageUrl || fieldErrors.file}
          />

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Coffee Lot / Variety *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.title;
                      return copy;
                    });
                  }
                }}
                placeholder="Ethiopia Yirgacheffe..."
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 ${
                  fieldErrors.title
                    ? 'border-rose-500 focus:ring-rose-500/40'
                    : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/30'
                }`}
              />
              {fieldErrors.title && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Roaster *
              </label>
              <input
                type="text"
                value={roaster}
                onChange={(e) => {
                  setRoaster(e.target.value);
                  if (fieldErrors.roaster) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.roaster;
                      return copy;
                    });
                  }
                }}
                placeholder="Submarine / The Barn / Square Mile..."
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 ${
                  fieldErrors.roaster
                    ? 'border-rose-500 focus:ring-rose-500/40'
                    : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/30'
                }`}
              />
              {fieldErrors.roaster && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.roaster}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Brew Method
              </label>
              <CustomSelect
                value={method}
                onChange={(val) => {
                  setMethod(val as BrewMethod);
                  if (fieldErrors.method) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.method;
                      return copy;
                    });
                  }
                }}
                options={METHODS}
                hasError={!!fieldErrors.method}
              />
              {fieldErrors.method && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors.method}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Origin / Altitude
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  if (fieldErrors.origin) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.origin;
                      return copy;
                    });
                  }
                }}
                placeholder="Ethiopia, Gedeo (2000m)"
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 ${
                  fieldErrors.origin
                    ? 'border-rose-500 focus:ring-rose-500/40'
                    : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/30'
                }`}
              />
              {fieldErrors.origin && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors.origin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Processing
              </label>
              <CustomSelect
                value={processingMethod}
                onChange={setProcessingMethod}
                options={[
                  'Washed',
                  'Natural',
                  'Honey',
                  'Anaerobic',
                  'Experimental',
                ]}
              />
            </div>
          </div>

          {/* Ratio Calculator Section */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Scale className="w-4 h-4" />
                <span>Smart Ratio Calculator</span>
              </div>
              <div className="flex items-center gap-1">
                {[15, 16, 16.6].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => applyRatio(ratio)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    1:{ratio === 16.6 ? '16.6' : ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Coffee (g)</label>
                <NumberInput
                  step={0.5}
                  min={1}
                  max={200}
                  value={coffeeWeight}
                  onChange={(val) => {
                    setCoffeeWeight(val);
                    if (fieldErrors.coffeeWeight) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.coffeeWeight;
                        return copy;
                      });
                    }
                  }}
                  hasError={!!fieldErrors.coffeeWeight}
                />
                {fieldErrors.coffeeWeight && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.coffeeWeight}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Water (ml)</label>
                <NumberInput
                  step={5}
                  min={10}
                  max={2000}
                  value={waterAmount}
                  onChange={(val) => {
                    setWaterAmount(val);
                    if (fieldErrors.waterAmount) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.waterAmount;
                        return copy;
                      });
                    }
                  }}
                  hasError={!!fieldErrors.waterAmount}
                />
                {fieldErrors.waterAmount && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.waterAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Temp (°C)</label>
                <NumberInput
                  step={1}
                  min={50}
                  max={100}
                  value={waterTemperature}
                  onChange={(val) => {
                    setWaterTemperature(val);
                    if (fieldErrors.waterTemperature) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.waterTemperature;
                        return copy;
                      });
                    }
                  }}
                  hasError={!!fieldErrors.waterTemperature}
                />
                {fieldErrors.waterTemperature && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.waterTemperature}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Time (sec)</label>
                <NumberInput
                  step={5}
                  min={1}
                  max={1200}
                  value={brewTimeSeconds}
                  onChange={(val) => {
                    setBrewTimeSeconds(val);
                    if (fieldErrors.brewTimeSeconds) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.brewTimeSeconds;
                        return copy;
                      });
                    }
                  }}
                  hasError={!!fieldErrors.brewTimeSeconds}
                />
                {fieldErrors.brewTimeSeconds && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.brewTimeSeconds}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Grind Size</label>
              <input
                type="text"
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                placeholder="18 clicks (Comandante C40)"
                className={`w-full px-3 py-1.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100 ${
                  fieldErrors.grindSize ? 'border-rose-500' : 'border-zinc-800'
                }`}
              />
              {fieldErrors.grindSize && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.grindSize}</p>
              )}
            </div>
          </div>

          {/* Overall Rating (1-5 Stars) */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Overall Cup Rating
              </label>
              <span className="text-xs text-amber-400 font-bold font-mono">
                {rating} / 5 Stars
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    className="p-1 rounded-lg hover:bg-zinc-800 transition-all focus:outline-none"
                    title={`Rate ${starVal} out of 5 stars`}
                  >
                    <Star
                      className={`w-5 h-5 transition-all ${
                        starVal <= rating
                          ? 'fill-amber-400 text-amber-400 scale-105'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-400">
                {rating === 5
                  ? 'Exceptional Cup (Top Tier)'
                  : rating === 4
                  ? 'Great Brew (Recommended)'
                  : rating === 3
                  ? 'Solid Daily Driver'
                  : rating === 2
                  ? 'Suboptimal Extraction'
                  : 'Poor Cup'}
              </span>
            </div>
          </div>

          {/* Sensory Profile */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Sensory Profile (Intensity 1 - 5)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SensoryControl
                label="Acidity"
                value={acidity}
                onChange={setAcidity}
                levels={['Subtle', 'Mild', 'Medium', 'Bright', 'Vibrant']}
              />
              <SensoryControl
                label="Sweetness"
                value={sweetness}
                onChange={setSweetness}
                levels={['Dry', 'Light', 'Balanced', 'Sweet', 'Syrupy']}
              />
              <SensoryControl
                label="Body"
                value={body}
                onChange={setBody}
                levels={['Tea-like', 'Light', 'Medium', 'Full', 'Heavy']}
              />
            </div>
          </div>

          {/* Tasting Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Flavor Descriptors
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tastingNotes.map((note) => (
                <span
                  key={note}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  {note}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(note)}
                    className="hover:text-amber-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTag);
                  }
                }}
                placeholder="Add custom descriptor (Press Enter)..."
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTag)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[11px] text-zinc-500 mr-1 self-center">Popular:</span>
              {PRESET_DESCRIPTORS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleAddTag(d)}
                  className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? 'Saving...'
              : initialData
              ? 'Save Changes'
              : 'Create Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
};
