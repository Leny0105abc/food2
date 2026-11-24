import React, { useMemo, useState } from 'react';
import { Check, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { AisleCategory, GroceryItem } from '../types/recipe';

interface GroceryViewProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddCustomItem: (name: string, amount: number, unit: string, aisle: AisleCategory) => void;
  onClearChecked: () => void;
  onGenerateFromPlan: () => void;
}

const AISLES: AisleCategory[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry & Sauces',
  'Herbs & Spices',
  'Bakery & Grains',
];

export const GroceryView: React.FC<GroceryViewProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
  onAddCustomItem,
  onClearChecked,
  onGenerateFromPlan,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [aisle, setAisle] = useState<AisleCategory>('Produce');

  const checkedCount = items.filter((i) => i.checked).length;

  const grouped = useMemo(() => {
    const map = new Map<AisleCategory, GroceryItem[]>();
    AISLES.forEach((a) => map.set(a, []));
    items.forEach((item) => {
      const list = map.get(item.aisle) || [];
      list.push(item);
      map.set(item.aisle, list);
    });
    return AISLES.map((a) => ({ aisle: a, list: map.get(a) || [] })).filter(
      (g) => g.list.length > 0
    );
  }, [items]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCustomItem(name.trim(), Number(amount) || 1, unit.trim() || 'pcs', aisle);
    setName('');
    setAmount('1');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Grocery List</h1>
          <p className="text-sm text-[var(--muted)] mt-1 font-mono-num">
            {items.length === 0
              ? 'No items yet — add ingredients from any recipe or your weekly planner.'
              : `${checkedCount} of ${items.length} items checked off`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerateFromPlan}
            className="min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-xs font-medium cursor-pointer"
          >
            Sync from Meal Plan
          </button>
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={onClearChecked}
              className="min-h-[44px] px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-medium cursor-pointer"
            >
              Clear Checked ({checkedCount})
            </button>
          )}
        </div>
      </div>

      {/* Custom Quick-Add Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add item (e.g., Calamansi limes)"
          aria-label="Grocery item name"
          className="sm:col-span-5 min-h-[44px] px-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-sm"
        />
        <input
          type="number"
          step="0.5"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Quantity"
          className="sm:col-span-2 min-h-[44px] px-3 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-sm font-mono-num"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="unit"
          aria-label="Unit"
          className="sm:col-span-2 min-h-[44px] px-3 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-sm"
        />
        <select
          value={aisle}
          onChange={(e) => setAisle(e.target.value as AisleCategory)}
          aria-label="Supermarket aisle"
          className="sm:col-span-2 min-h-[44px] px-2.5 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-xs"
        >
          {AISLES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          aria-label="Add grocery item"
          className="sm:col-span-1 min-h-[44px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Empty State or Aisle Groups */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-10 text-center space-y-2.5">
          <ShoppingBasket className="w-8 h-8 mx-auto text-[var(--muted)]" />
          <h2 className="font-display text-lg font-semibold">Your basket is empty</h2>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            Open any dish to add its scaled ingredients, or tap Sync from Meal Plan above to compile your week.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {grouped.map((group) => (
            <section
              key={group.aisle}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] overflow-hidden"
            >
              <header className="px-4 py-3 bg-[var(--surface-muted)]/60 border-b border-[var(--border-hairline)] flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">{group.aisle}</h2>
                <span className="font-mono-num text-xs text-[var(--muted)]">
                  {group.list.length} items
                </span>
              </header>
              <ul className="divide-y divide-[var(--border-hairline)]">
                {group.list.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 min-h-[56px] hover:bg-[var(--surface-muted)]/35 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleItem(item.id)}
                      className="flex-1 flex items-center gap-3 text-left py-2.5 cursor-pointer min-w-0"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          item.checked
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                            : 'border-[var(--muted)]'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            item.checked ? 'line-through text-[var(--muted)]' : ''
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] truncate">
                          {item.sourceRecipeTitle}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-num text-xs text-[var(--muted)]">
                        {Number(item.amount.toFixed(1))} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
