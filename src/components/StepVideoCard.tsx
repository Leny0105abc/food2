import React, { useEffect, useState } from 'react';
import { Pause, Play, Volume2, VolumeX, Eye, Lightbulb } from 'lucide-react';
import { RecipeStep, TechniqueAnimation } from '../types/recipe';

interface StepVideoCardProps {
  step: RecipeStep;
  imageUrl: string;
  dishTitle: string;
  compact?: boolean;
}

const TECHNIQUE_LABELS: Record<TechniqueAnimation, string> = {
  sear: 'High-Heat Sear & Crisp',
  simmer: 'Gentle Braise & Simmer',
  steam: 'Aromatic Steam Infusion',
  chop: 'Precision Knife Prep',
  whisk: 'Emulsion & Whisk',
  toss: 'Wok / Pan Fold & Toss',
  plate: 'Final Garnish & Plate',
};

export const StepVideoCard: React.FC<StepVideoCardProps> = ({
  step,
  imageUrl,
  dishTitle,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Smooth looping 12-second instructional motion loop per step
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [step.stepNumber, dishTitle]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 120);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `Step ${step.stepNumber}: ${step.title}. ${step.instruction} Visual cue: ${step.visualCue}`
    );
    utterance.rate = 0.96;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const phase = (progress / 100) * Math.PI * 2;
  const bobY = isPlaying ? Math.sin(phase * 2) * 5 : 0;
  const rotateDeg = isPlaying ? Math.sin(phase) * 8 : 0;
  const pulseScale = isPlaying ? 1 + Math.sin(phase * 2) * 0.06 : 1;

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--surface)]">
      {/* Offline-Cacheable Motion Tutorial Viewport */}
      <div className={`relative w-full overflow-hidden bg-stone-900 ${compact ? 'h-48' : 'h-60 sm:h-72'}`}>
        <img
          src={imageUrl}
          alt={`${dishTitle} — Step ${step.stepNumber}: ${step.title}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45 scale-105 transition-transform duration-700"
          style={{
            transform: isPlaying ? `scale(${1.04 + Math.sin(phase) * 0.03})` : 'scale(1.04)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

        {/* Animated Culinary Technique Illustration */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <div
            className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-3 transition-transform duration-150"
            style={{
              transform: `translateY(${bobY}px) rotate(${rotateDeg}deg) scale(${pulseScale})`,
            }}
          >
            {step.techniqueAnimation === 'simmer' || step.techniqueAnimation === 'steam' ? (
              <svg viewBox="0 0 64 64" className="w-11 h-11 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 36h32c0 9-7 16-16 16s-16-7-16-16Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 36h40" strokeLinecap="round" />
                <path
                  d="M24 26c0-4 4-5 4-9M32 24c0-4 4-5 4-9M40 26c0-4 4-5 4-9"
                  strokeLinecap="round"
                  style={{ opacity: isPlaying ? 0.65 + 0.35 * Math.sin(phase * 2) : 0.8 }}
                />
              </svg>
            ) : step.techniqueAnimation === 'chop' ? (
              <svg viewBox="0 0 64 64" className="w-11 h-11 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 48h36" strokeLinecap="round" />
                <path d="M18 38l22-20 8 8-18 18-12-6Z" strokeLinejoin="round" />
                <circle cx="24" cy="43" r="2.5" fill="currentColor" />
                <circle cx="34" cy="43" r="2.5" fill="currentColor" />
              </svg>
            ) : step.techniqueAnimation === 'whisk' ? (
              <svg viewBox="0 0 64 64" className="w-11 h-11 text-amber-200" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 38c0 9 8 15 18 15s18-6 18-15H14Z" strokeLinejoin="round" />
                <path d="M32 10v18M26 28c0 6 12 6 12 0" strokeLinecap="round" />
                <ellipse cx="32" cy="31" rx="10" ry="4" strokeDasharray="3 3" />
              </svg>
            ) : (
              <svg viewBox="0 0 64 64" className="w-11 h-11 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 38h28c0 7-6 12-14 12s-14-5-14-12Z" strokeLinejoin="round" />
                <path d="M40 38l12-4" strokeLinecap="round" />
                <path d="M22 25l3-6M30 23l0-7M37 25l-3-6" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <p className="text-xs font-medium text-amber-200 tracking-wide">
            {TECHNIQUE_LABELS[step.techniqueAnimation]}
          </p>
          <h4 className="font-display text-lg sm:text-xl font-semibold text-white mt-1 text-balance">
            {step.stepNumber}. {step.title}
          </h4>
        </div>

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Pause step tutorial' : 'Play step tutorial'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Interactive Scrubber */}
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                setIsPlaying(false);
              }}
              aria-label="Scrub step motion loop"
              className="w-full accent-amber-400 cursor-pointer h-1.5"
            />
            <div className="flex items-center justify-between text-[11px] text-white/80 font-mono-num">
              <span>Offline Video Card</span>
              <span>{Math.ceil(step.durationSeconds / 60)} min step</span>
            </div>
          </div>

          {typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={toggleSpeak}
              aria-label={isSpeaking ? 'Stop voice guidance' : 'Read step aloud'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full backdrop-blur-sm transition-colors cursor-pointer shrink-0 ${
                isSpeaking ? 'bg-amber-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Visual Cue & Pro Tip */}
      <div className="p-4 space-y-2.5 text-sm">
        <div className="flex items-start gap-2.5">
          <Eye className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <p className="text-[var(--foreground)] leading-snug">
            <span className="font-semibold">Visual cue: </span>
            <span className="text-[var(--muted)]">{step.visualCue}</span>
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-[var(--amber-alert)] shrink-0 mt-0.5" />
          <p className="text-[var(--foreground)] leading-snug">
            <span className="font-semibold">Kitchen tip: </span>
            <span className="text-[var(--muted)]">{step.proTip}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
