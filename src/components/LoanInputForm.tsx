/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoanInput } from '../types';
import { HelpCircle, Percent, Calendar, Landmark, Info, BookmarkPlus, FolderKanban } from 'lucide-react';

interface LoanInputFormProps {
  input: LoanInput;
  onChange: (newInput: LoanInput) => void;
  onSavePlanClick?: () => void;
  onOpenDrawerClick?: () => void;
  savedPlansCount?: number;
}

export function LoanInputForm({
  input,
  onChange,
  onSavePlanClick,
  onOpenDrawerClick,
  savedPlansCount = 0,
}: LoanInputFormProps) {
  const handleAmountChange = (val: number) => {
    // 限制合理范围
    const cleanVal = Math.max(1, Math.min(10000, val));
    onChange({ ...input, loanAmount: cleanVal });
  };

  const handleTermChange = (years: number) => {
    const cleanYears = Math.max(1, Math.min(30, years));
    // 提前还款年限不能超过贷款年限
    const newPrepaymentYear = Math.min(input.prepaymentYear, cleanYears);
    onChange({
      ...input,
      loanTermYears: cleanYears,
      prepaymentYear: newPrepaymentYear,
    });
  };

  const handleRateChange = (rate: number) => {
    const cleanRate = Math.max(0.1, Math.min(20, rate));
    onChange({ ...input, annualRate: cleanRate });
  };

  const handlePrepaymentYearChange = (year: number) => {
    const cleanYear = Math.max(1, Math.min(input.loanTermYears, year));
    onChange({
      ...input,
      prepaymentYear: cleanYear,
    });
  };

  const handlePrepaymentMonthInYearChange = (monthInYear: number) => {
    // 重新计算总的 prepaymentMonth
    const cleanMonth = Math.max(1, Math.min(12, monthInYear));
    const totalMonths = (input.prepaymentYear - 1) * 12 + cleanMonth;
    onChange({
      ...input,
      prepaymentMonth: totalMonths,
    });
  };

  // 当前提前还款是第几个月在年内的对应 (1-12)
  const currentPrepayMonthInYear = ((input.prepaymentMonth - 1) % 12) + 1;

  // 利率快捷预设
  const ratePresets = [
    { label: '3.1% (公积金)', value: 3.1 },
    { label: '3.5% (当前较低LPR)', value: 3.5 },
    { label: '3.85% (常见商业LPR)', value: 3.85 },
    { label: '4.2% (历史LPR基准)', value: 4.2 },
  ];

  // 金额快捷预设 (万元)
  const amountPresets = [50, 100, 150, 200, 300];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600" />
          第一步：设置贷款基础配置信息
        </h3>

        <div className="flex items-center gap-2">
          {onSavePlanClick && (
            <button
              onClick={onSavePlanClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="将当前配置存入方案库"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>保存为方案</span>
            </button>
          )}

          {onOpenDrawerClick && (
            <button
              onClick={onOpenDrawerClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
              title="查看已保存的全部方案"
            >
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
              <span>方案库 ({savedPlansCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 1. 贷款金额 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              贷款本金金额
              <span className="text-[10px] font-normal text-slate-450">(公积金/商贷合计)</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <input
                type="number"
                value={input.loanAmount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className="w-16 text-right font-mono font-bold text-sm bg-transparent outline-hidden text-slate-800 dark:text-slate-200"
                min="1"
                max="10000"
              />
              <span className="text-xs font-bold text-slate-500">万元</span>
            </div>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="5"
            value={input.loanAmount <= 500 ? input.loanAmount : 500}
            onChange={(e) => handleAmountChange(parseInt(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex gap-2 flex-wrap">
            {amountPresets.map((amt) => (
              <button
                key={amt}
                onClick={() => handleAmountChange(amt)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  input.loanAmount === amt
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30'
                }`}
              >
                {amt}万
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block pt-0.5">
            等值于人民币大写：{' '}
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">
              {(input.loanAmount * 10000).toLocaleString()}
            </strong>{' '}
            元
          </span>
        </div>

        {/* 2. 贷款期限 */}
        <div className="space-y-4 md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-8">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              贷款年限
            </label>
            <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-sm">
              {input.loanTermYears} 年 ({input.loanTermYears * 12} 期)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={input.loanTermYears}
            onChange={(e) => handleTermChange(parseInt(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex gap-2">
            {[10, 15, 20, 25, 30].map((t) => (
              <button
                key={t}
                onClick={() => handleTermChange(t)}
                className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  input.loanTermYears === t
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30'
                }`}
              >
                {t}年
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block pt-0.5">
            中国多数商业贷款默认推荐期限为 <strong className="text-slate-700 dark:text-slate-300 font-semibold">30年</strong> / <strong className="text-slate-700 dark:text-slate-300 font-semibold">20年</strong>。
          </span>
        </div>

        {/* 3. 贷款年利率 */}
        <div className="space-y-4 md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-8">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              按揭年利率
            </label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                value={input.annualRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                className="w-12 text-right font-mono font-bold text-sm bg-transparent outline-hidden text-slate-800 dark:text-slate-200"
                step="0.05"
                min="0.1"
                max="20"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ratePresets.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRateChange(r.value)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-left cursor-pointer ${
                  input.annualRate === r.value
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block pt-0.5">
            支持输入自定义任意利率。计算基于最新固定/动态年化等值复利公式进行。
          </span>
        </div>
      </div>
    </div>
  );
}
