/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedPlan, PlanColorTag } from '../types';
import { 
  FolderKanban, 
  BookmarkPlus, 
  Scale, 
  Check, 
  Sparkles, 
  ChevronRight,
  Layers,
  Plus
} from 'lucide-react';

interface QuickPlanSwitcherProps {
  plans: SavedPlan[];
  activePlanId?: string;
  onApplyPlan: (plan: SavedPlan) => void;
  onOpenDrawer: () => void;
  onOpenSaveModal: () => void;
  onOpenComparisonMatrix: () => void;
  selectedPlanCount: number;
}

const COLOR_DOT: Record<PlanColorTag, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

export function QuickPlanSwitcher({
  plans,
  activePlanId,
  onApplyPlan,
  onOpenDrawer,
  onOpenSaveModal,
  onOpenComparisonMatrix,
  selectedPlanCount,
}: QuickPlanSwitcherProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
      {/* Drawer Toggle Pill */}
      <button
        onClick={onOpenDrawer}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs"
      >
        <FolderKanban className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>方案库</span>
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
          {plans.length}
        </span>
      </button>

      {/* Save current plan pill */}
      <button
        onClick={onOpenSaveModal}
        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold border border-blue-200/70 dark:border-blue-800/70 transition-all cursor-pointer"
        title="将当前计算参数存为新方案"
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
        <span>保存当前</span>
      </button>

      {/* Comparison pill */}
      {plans.length >= 2 && (
        <button
          onClick={onOpenComparisonMatrix}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/70 dark:border-indigo-800/70 transition-all cursor-pointer"
          title="多方案横向直观比对"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>横向对比 {selectedPlanCount > 0 && `(${selectedPlanCount})`}</span>
        </button>
      )}

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

      {/* Individual Plan Chips */}
      {plans.map((plan) => {
        const isActive = plan.id === activePlanId;
        const dotColor = COLOR_DOT[plan.colorTag || 'blue'];

        return (
          <button
            key={plan.id}
            onClick={() => onApplyPlan(plan)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 font-medium'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotColor}`} />
            <span className="max-w-[140px] truncate">{plan.name}</span>
            {isActive && <Check className="w-3 h-3 stroke-[2.5]" />}
          </button>
        );
      })}
    </div>
  );
}
