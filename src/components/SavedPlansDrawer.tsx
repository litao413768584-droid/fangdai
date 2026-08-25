/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SavedPlan, LoanInput, PlanColorTag } from '../types';
import { getComparison } from '../utils';
import { 
  FolderKanban, 
  X, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Copy, 
  Scale, 
  Sparkles, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface SavedPlansDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SavedPlan[];
  activePlanId?: string;
  onApplyPlan: (plan: SavedPlan) => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (plan: SavedPlan) => void;
  onEditPlan: (plan: SavedPlan) => void;
  onOpenSaveModal: () => void;
  selectedPlanIds: string[];
  onToggleSelectPlan: (id: string) => void;
  onOpenComparisonMatrix: () => void;
  onResetDefaultPlans: () => void;
}

const COLOR_MAP: Record<PlanColorTag, { badgeBg: string; text: string; border: string; dot: string }> = {
  blue: { badgeBg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  emerald: { badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  indigo: { badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  purple: { badgeBg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  amber: { badgeBg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  rose: { badgeBg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
};

export function SavedPlansDrawer({
  isOpen,
  onClose,
  plans,
  activePlanId,
  onApplyPlan,
  onDeletePlan,
  onDuplicatePlan,
  onEditPlan,
  onOpenSaveModal,
  selectedPlanIds,
  onToggleSelectPlan,
  onOpenComparisonMatrix,
  onResetDefaultPlans,
}: SavedPlansDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>贷款方案库</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {plans.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  保存并随心切换不同金额、期限及利率组合
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Top Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenSaveModal();
              }}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>保存当前参数为新方案</span>
            </button>

            {plans.length >= 2 && (
              <button
                onClick={() => {
                  onOpenComparisonMatrix();
                }}
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>方案对比 ({selectedPlanIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Plans List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {plans.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                暂无保存的贷款方案
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                点击上方“保存当前参数为新方案”，将您当前的试算配置永久存入方案库
              </p>
              <button
                onClick={onResetDefaultPlans}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> 恢复示例方案
              </button>
            </div>
          ) : (
            plans.map((plan) => {
              const color = COLOR_MAP[plan.colorTag || 'blue'];
              const isActive = plan.id === activePlanId;
              const isSelectedForComparison = selectedPlanIds.includes(plan.id);

              // 快速计算核心概览
              const comp = getComparison(
                plan.input.loanAmount,
                plan.input.loanTermYears,
                plan.input.annualRate
              );

              return (
                <div
                  key={plan.id}
                  className={`relative p-4 rounded-2xl border transition-all space-y-3 ${
                    isActive
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                  }`}
                >
                  {/* Plan Top Meta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {plan.name}
                          </h4>
                          {isActive && (
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                              当前使用中
                            </span>
                          )}
                        </div>
                        {plan.note && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {plan.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Compare checkbox */}
                    <button
                      onClick={() => onToggleSelectPlan(plan.id)}
                      title={isSelectedForComparison ? '取消勾选对比' : '勾选加入横向对比'}
                      className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelectedForComparison
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-xs flex items-center justify-center border ${
                        isSelectedForComparison ? 'border-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelectedForComparison && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                      <span>对比</span>
                    </button>
                  </div>

                  {/* Badges snapshot */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">贷款金额</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {plan.input.loanAmount} <span className="text-[10px] font-normal">万</span>
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">贷款年限</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {plan.input.loanTermYears} <span className="text-[10px] font-normal">年</span>
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">执行年利率</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        {plan.input.annualRate} <span className="text-[10px] font-normal">%</span>
                      </span>
                    </div>
                  </div>

                  {/* Calculated Quick Summary */}
                  <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">本息月供:</span>
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                        ¥{Math.round(comp.equalPortion.monthlyPaymentFirst).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">总利息:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {(comp.equalPortion.totalInterest / 10000).toFixed(2)}万
                      </span>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditPlan(plan)}
                        title="编辑方案备注与信息"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicatePlan(plan)}
                        title="复制克隆此方案"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePlan(plan.id)}
                        title="删除方案"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onApplyPlan(plan);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已在计算</span>
                        </>
                      ) : (
                        <>
                          <span>切换至此方案</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            onClick={onResetDefaultPlans}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复系统预设方案</span>
          </button>

          {plans.length >= 2 && (
            <button
              onClick={() => {
                onOpenComparisonMatrix();
              }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>多方案横向对比矩阵</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
