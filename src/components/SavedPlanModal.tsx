/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { LoanInput, PlanColorTag, SavedPlan } from '../types';
import { X, BookmarkPlus, Sparkles, Check, Tag } from 'lucide-react';

interface SavedPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInput: LoanInput;
  onSave: (plan: Omit<SavedPlan, 'id' | 'createdAt'>) => void;
  editingPlan?: SavedPlan | null;
}

const COLOR_OPTIONS: { tag: PlanColorTag; label: string; bgClass: string; ringClass: string }[] = [
  { tag: 'blue', label: '天青蓝', bgClass: 'bg-blue-500', ringClass: 'ring-blue-400' },
  { tag: 'emerald', label: '翡翠绿', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-400' },
  { tag: 'indigo', label: '深靛蓝', bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-400' },
  { tag: 'purple', label: '极光紫', bgClass: 'bg-purple-500', ringClass: 'ring-purple-400' },
  { tag: 'amber', label: '琥珀金', bgClass: 'bg-amber-500', ringClass: 'ring-amber-400' },
  { tag: 'rose', label: '珊瑚红', bgClass: 'bg-rose-500', ringClass: 'ring-rose-400' },
];

export function SavedPlanModal({
  isOpen,
  onClose,
  currentInput,
  onSave,
  editingPlan,
}: SavedPlanModalProps) {
  const defaultAutoName = `${currentInput.loanAmount}万 · ${currentInput.loanTermYears}年 · ${currentInput.annualRate}%`;
  
  const [name, setName] = useState(editingPlan ? editingPlan.name : defaultAutoName);
  const [note, setNote] = useState(editingPlan ? editingPlan.note || '' : '');
  const [selectedColor, setSelectedColor] = useState<PlanColorTag>(
    editingPlan?.colorTag || 'blue'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || defaultAutoName;
    onSave({
      name: finalName,
      note: note.trim() || undefined,
      colorTag: selectedColor,
      input: { ...currentInput },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingPlan ? '编辑方案信息' : '保存当前贷款方案'}
              </h3>
              <p className="text-xs text-slate-400">
                将当前计算参数存入方案库，方便随时切换与多维对比
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current parameter preview pills */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>当前方案核心配置参数</span>
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 实时捕获
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block">贷款金额</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  {currentInput.loanAmount} <span className="text-xs font-normal text-slate-400">万</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block">贷款年限</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  {currentInput.loanTermYears} <span className="text-xs font-normal text-slate-400">年</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block">执行年利率</span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {currentInput.annualRate} <span className="text-xs font-normal text-slate-400">%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Scheme Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>方案名称</span>
              <button
                type="button"
                onClick={() => setName(defaultAutoName)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                填入自动格式名
              </button>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：首套公积金组合贷款 / 二套商贷 3.5%"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
              maxLength={40}
              required
            />
          </div>

          {/* Color tag selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>标记标签色</span>
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.tag}
                  type="button"
                  onClick={() => setSelectedColor(c.tag)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center text-white transition-all cursor-pointer ${
                    selectedColor === c.tag ? `ring-3 ${c.ringClass} ring-offset-2 dark:ring-offset-slate-900 scale-110` : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {selectedColor === c.tag && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              备忘说明 / 银行与政策备注 <span className="text-[10px] font-normal text-slate-400">(选填)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：建设银行优质客户优惠利率、计划满3年提前还款20万等..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 resize-none"
              maxLength={150}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {editingPlan ? '保存修改' : '确认保存方案'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
