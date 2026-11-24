import React from 'react';
import { NutritionGoals, NutritionInfo } from '../types/recipe';

interface MacroRingsProps {
  consumed: NutritionInfo;
  goals: NutritionGoals;
}

interface RingItemProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  strokeColor: string;
  size?: number;
}

const SingleRing: React.FC<RingItemProps> = ({
  label,
  value,
  goal,
  unit,
  strokeColor,
  size = 86,
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(1, value / goal) : 0;
  const dashOffset = circumference * (1 - ratio);
  const over = value > goal;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[var(--surface-muted)]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? 'var(--amber-alert)' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-num text-sm font-semibold text-[var(--foreground)]">
            {Math.round(value)}
          </span>
          <span className="font-mono-num text-[10px] text-[var(--muted)]">
            /{goal}
            {unit}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-[var(--foreground)]">{label}</span>
      {over && (
        <span className="text-[11px] font-medium text-[var(--amber-alert)]">Over target</span>
      )}
    </div>
  );
};

export const MacroRings: React.FC<MacroRingsProps> = ({ consumed, goals }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
      <SingleRing
        label="Calories"
        value={consumed.calories}
        goal={goals.calories}
        unit="kcal"
        strokeColor="#2E5A44"
        size={92}
      />
      <SingleRing
        label="Protein"
        value={consumed.protein}
        goal={goals.protein}
        unit="g"
        strokeColor="#3B7A57"
        size={92}
      />
      <SingleRing
        label="Net Carbs"
        value={consumed.carbs}
        goal={goals.carbs}
        unit="g"
        strokeColor="#D97706"
        size={92}
      />
      <SingleRing
        label="Fat"
        value={consumed.fat}
        goal={goals.fat}
        unit="g"
        strokeColor="#78716C"
        size={92}
      />
    </div>
  );
};
