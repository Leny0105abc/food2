import React, { useState } from 'react';
import { Check, Copy, Printer, Share2, X } from 'lucide-react';
import { Recipe } from '../types/recipe';

interface ShareSheetProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  recipe,
  servings,
  onClose,
  onToast,
}) => {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const scale = servings / recipe.baseServings;
  const formattedText = [
    `${recipe.title} (${recipe.cuisine} · ${recipe.skillLevel})`,
    `${recipe.prepMinutes + recipe.cookMinutes} min · ${recipe.nutritionPerServing.calories} kcal/serving`,
    recipe.dietaryTags.length ? `Dietary: ${recipe.dietaryTags.join(', ')}` : '',
    '',
    `Ingredients (${servings} servings):`,
    ...recipe.ingredients.map(
      (ing) => `• ${Number((ing.amount * scale).toFixed(1))} ${ing.unit} ${ing.name}`
    ),
    '',
    recipe.shareBlurb,
  ]
    .filter(Boolean)
    .join('\n');

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recipe.title} — Kusina & Co.`,
          text: formattedText,
          url: window.location.href,
        });
        onToast('Shared recipe successfully');
        onClose();
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    await handleCopyCard();
  };

  const handleCopyCard = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedCard(true);
      onToast('Recipe card copied to clipboard');
      setTimeout(() => setCopiedCard(false), 2000);
    } catch {
      onToast('Unable to access clipboard');
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/?dish=${encodeURIComponent(recipe.id)}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onToast('Dish link copied');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onToast('Unable to copy link');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${recipe.title}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--border-hairline)] p-6 space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-[var(--surface-muted)] rounded-full mx-auto sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Share Dish
            </h3>
            <p className="text-sm text-[var(--muted)] mt-0.5">{recipe.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] p-3.5 text-xs text-[var(--muted)] max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
          {formattedText}
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium cursor-pointer transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share via Device Apps
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyCard}
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer"
            >
              {copiedCard ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
              {copiedCard ? 'Copied Card' : 'Copy Recipe'}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Link Copied' : 'Copy Link'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Recipe Card
          </button>
        </div>
      </div>
    </div>
  );
};
