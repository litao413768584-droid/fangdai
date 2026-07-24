/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LoanInput, RepaymentMethod, LoanResultSummary, PrepaymentEvent } from '../types';
import { simulateMultiplePrepayments, PrepaymentSimulationResult } from '../utils';
import { 
  CalendarRange, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  BadgePercent, 
  Coins, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Info,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';

interface PrepaymentSandboxProps {
  input: LoanInput;
  equalPortion: LoanResultSummary;
  equalPrincipal: LoanResultSummary;
  activeMethod: RepaymentMethod;
  onActiveMethodChange: (method: RepaymentMethod) => void;
  onSimulationChange: (
    portionSim: PrepaymentSimulationResult,
    principalSim: PrepaymentSimulationResult,
    activeMethod: RepaymentMethod
  ) => void;
  onLoanInputUpdate?: (newInput: LoanInput) => void;
}

export function PrepaymentSandbox({
  input,
  equalPortion,
  equalPrincipal,
  activeMethod,
  onActiveMethodChange,
  onSimulationChange,
  onLoanInputUpdate,
}: PrepaymentSandboxProps) {
  // 引导向导状态
  const [useWizard, setUseWizard] = useState<boolean>(true);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // 提前还贷类型: 'full' (全额结清), 'partial' (部分提前还款)
  const [prepayType, setPrepayType] = useState<'full' | 'partial'>('partial');

  // 多次提前还款配置列表
  const [prepayEvents, setPrepayEvents] = useState<PrepaymentEvent[]>([
    {
      id: 'default',
      monthIndex: (input.prepaymentYear - 1) * 12 + (input.prepaymentMonth % 12 || 12),
      yearNumber: input.prepaymentYear,
      monthInYear: (input.prepaymentMonth % 12 || 12),
      amountWan: 10,
      prepayType: 'partial',
      strategy: 'reduce_term',
    },
  ]);

  // 当基础贷款年限缩短时，保证已有的提前还款年限点不越界
  useEffect(() => {
    setPrepayEvents(prev =>
      prev.map(e => {
        if (e.yearNumber > input.loanTermYears) {
          const newYear = input.loanTermYears;
          const newMonthIndex = (newYear - 1) * 12 + e.monthInYear;
          return {
            ...e,
            yearNumber: newYear,
            monthIndex: newMonthIndex
          };
        }
        return e;
      })
    );
  }, [input.loanTermYears]);

  // 获取对应的计划详情
  const currentSummary = activeMethod === RepaymentMethod.EQUAL_PORTION ? equalPortion : equalPrincipal;
  const originalDetails = currentSummary.monthlyPaymentDetail;
  const totalMonths = originalDetails.length;

  // 找出第一个提前还款事件所在的月份
  const sortedEvents = [...prepayEvents].sort((a, b) => a.monthIndex - b.monthIndex);
  const firstPrepayMonth = sortedEvents[0] ? Math.min(sortedEvents[0].monthIndex, totalMonths) : totalMonths;

  // 获取第一个还款节点对应的月份详情
  const currentMonthDetail = originalDetails[firstPrepayMonth - 1] || {
    cumulativePrincipal: 0,
    cumulativeInterest: 0,
    cumulativeTotal: 0,
    remainingPrincipal: 0,
  };

  const remainingPrincipalBeforePrepay = currentMonthDetail.remainingPrincipal;

  // 累计提前还款的总金额 (万元)
  const totalExtraAmountWan = prepayEvents.reduce((sum, e) => sum + (e.prepayType === 'full' ? 0 : e.amountWan), 0);

  const activeStrategy = prepayEvents[0]?.strategy || 'reduce_term';

  // 进行提前还款模拟 (部分/全部)
  const simResultPortion = simulateMultiplePrepayments(
    equalPortion,
    input.loanAmount,
    input.annualRate,
    prepayEvents
  );

  const simResultPrincipal = simulateMultiplePrepayments(
    equalPrincipal,
    input.loanAmount,
    input.annualRate,
    prepayEvents
  );

  // 将结果传递给父级，以便表格显示对应修改后的计划
  useEffect(() => {
    onSimulationChange(simResultPortion, simResultPrincipal, activeMethod);
  }, [
    input,
    equalPortion,
    equalPrincipal,
    prepayEvents,
    activeMethod,
  ]);

  const activeSimResult = activeMethod === RepaymentMethod.EQUAL_PORTION ? simResultPortion : simResultPrincipal;


  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-8">
      {/* Tab 切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-amber-500" />
            第二步：提前还款沙盒计算器
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            首次提前还款在第 <span className="font-bold font-mono text-amber-600">{firstPrepayMonth}</span> 期。目前已设定 <span className="font-bold font-mono text-blue-600">{prepayEvents.length}</span> 个还贷点。
          </p>
        </div>

        {/* 方案标签切换 */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/55 dark:border-slate-700/50">
          <button
            onClick={() => onActiveMethodChange(RepaymentMethod.EQUAL_PORTION)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeMethod === RepaymentMethod.EQUAL_PORTION
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            模拟：等额本息
          </button>
          <button
            onClick={() => onActiveMethodChange(RepaymentMethod.EQUAL_PRINCIPAL)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeMethod === RepaymentMethod.EQUAL_PRINCIPAL
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            模拟：等额本金
          </button>
        </div>
      </div>

      {/* 核心提前还款节点统计：已还多少，剩余多少 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            此时已还本金
          </span>
          <span className="text-lg font-mono font-black text-slate-700 dark:text-slate-300">
            ¥{(currentMonthDetail.cumulativePrincipal / 10000).toFixed(2)}
            <span className="text-xs font-normal text-slate-500 ml-0.5">万</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {Math.round(currentMonthDetail.cumulativePrincipal).toLocaleString()} 元
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            此时已还利息 (银行纯利)
          </span>
          <span className="text-lg font-mono font-black text-slate-700 dark:text-slate-300">
            ¥{(currentMonthDetail.cumulativeInterest / 10000).toFixed(2)}
            <span className="text-xs font-normal text-slate-500 ml-0.5">万</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {Math.round(currentMonthDetail.cumulativeInterest).toLocaleString()} 元
          </span>
        </div>

        <div className="bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08] p-4 rounded-xl border border-indigo-500/10">
          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 block uppercase">
            此时累计已还总额 (本+息)
          </span>
          <span className="text-lg font-mono font-black text-indigo-700 dark:text-indigo-300">
            ¥{(currentMonthDetail.cumulativeTotal / 10000).toFixed(2)}
            <span className="text-xs font-normal text-indigo-500 ml-0.5">万</span>
          </span>
          <span className="text-[10px] text-indigo-500/80 block mt-0.5">
            {Math.round(currentMonthDetail.cumulativeTotal).toLocaleString()} 元
          </span>
        </div>

        <div className="bg-amber-500/[0.04] dark:bg-amber-500/[0.08] p-4 rounded-xl border border-amber-500/15">
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block uppercase">
            此时剩余本金 (待还本金)
          </span>
          <span className="text-lg font-mono font-black text-amber-700 dark:text-amber-300">
            ¥{(remainingPrincipalBeforePrepay / 10000).toFixed(2)}
            <span className="text-xs font-normal text-amber-600 ml-0.5">万</span>
          </span>
          <span className="text-[10px] text-amber-600/80 block mt-0.5">
            {Math.round(remainingPrincipalBeforePrepay).toLocaleString()} 元
          </span>
        </div>
      </div>

      {/* 提前还贷沙盒操作台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
        {/* 控制面板 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 模式切换器 */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setUseWizard(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                useWizard
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              智能向导模式
            </button>
            <button
              onClick={() => setUseWizard(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !useWizard
                  ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              专家手动微调
            </button>
          </div>

          {useWizard ? (
            <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl p-4 border border-indigo-500/10 space-y-4">
              {/* 向导进度指示器 */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-200/50 dark:border-slate-800 pb-2">
                <span className="text-indigo-600 dark:text-indigo-400">⚡ 智能多期还贷向导</span>
                <span>步骤 {wizardStep} / 3</span>
              </div>

              {/* Step 1: Prepayment Type */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      第1步：您准备办理哪种提前还款？
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      一次性全部结清房贷，还是先部分还贷（支持多笔）？
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setPrepayType('partial');
                        setWizardStep(2);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                        prepayType === 'partial'
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-indigo-500 flex items-center justify-center text-[10px] font-black text-indigo-600 bg-indigo-50 mt-0.5 shrink-0">
                        A
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                          部分提前还贷 (支持多次还款)
                        </span>
                        <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                          还掉一部分本金。支持在不同时间段设置多次还款计划，加速缩短年限或减少月供。
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPrepayType('full');
                        // Reset to single event
                        setPrepayEvents([
                          {
                            id: 'default_full',
                            monthIndex: 36,
                            yearNumber: 3,
                            monthInYear: 12,
                            amountWan: 0,
                            prepayType: 'full',
                            strategy: 'reduce_term',
                          }
                        ]);
                        setWizardStep(2);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                        prepayType === 'full'
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center text-[10px] font-black text-amber-600 bg-amber-50 mt-0.5 shrink-0">
                        B
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                          一次性全额结清
                        </span>
                        <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                          设定一个时间点将目前剩余的本金一次性全部还清，从此销户，不再产生任何利息。
                        </span>
                      </div>
                    </button>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      下一步 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Combined Date, Amount & Strategy Configuration */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      第2步：配置提前还本时间、金额与调整策略
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {prepayType === 'partial' 
                        ? '您可以添加/删除多个提前还款点，并为每个点设置具体的时间、还款金额和调整方式。' 
                        : '请选择您一次性全部结清房贷的时间点。系统将自动清偿对应的剩余全部本金。'}
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {prepayEvents.map((event, idx) => {
                      const targetMonthDetail = originalDetails[event.monthIndex - 1] || originalDetails[originalDetails.length - 1] || { remainingPrincipal: 0 };
                      const remPrincipalWan = Math.floor(targetMonthDetail.remainingPrincipal / 10000);

                      return (
                        <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3.5 shadow-xs relative">
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              时间点 #{idx + 1} {prepayType === 'partial' ? '(多期点)' : '(全额结清点)'}
                            </span>
                            {prepayType === 'partial' && prepayEvents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPrepayEvents(prepayEvents.filter(e => e.id !== event.id));
                                }}
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> 删除
                              </button>
                            )}
                          </div>

                          {/* 时间配置 (年月选择) */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block mb-1">选择年份</span>
                              <select
                                value={event.yearNumber}
                                onChange={(e) => {
                                  const y = parseInt(e.target.value);
                                  const mIndex = (y - 1) * 12 + event.monthInYear;
                                  setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, yearNumber: y, monthIndex: mIndex } : ev));
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 py-1 px-2 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-200"
                              >
                                {Array.from({ length: input.loanTermYears }, (_, i) => i + 1).map((y) => (
                                  <option key={y} value={y}>
                                    第 {y} 年
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block mb-1">选择月份</span>
                              <select
                                value={event.monthInYear}
                                onChange={(e) => {
                                  const m = parseInt(e.target.value);
                                  const mIndex = (event.yearNumber - 1) * 12 + m;
                                  setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, monthInYear: m, monthIndex: mIndex } : ev));
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 py-1 px-2 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-200"
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                  <option key={m} value={m}>
                                    第 {m} 个月
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 font-medium">
                            将在还贷的第 <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{event.monthIndex}</span> 期末月供正常扣减后执行提前还贷。当前该期末剩余待还本金约：<strong className="text-slate-700 dark:text-slate-300 font-bold">¥{remPrincipalWan} 万元</strong>。
                          </div>

                          {/* 提前还款金额与策略 (如果是部分提前还款) */}
                          {prepayType === 'partial' ? (
                            <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">还贷本金金额</span>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                                  <input
                                    type="number"
                                    value={event.amountWan}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      const safeVal = Math.max(1, Math.min(remPrincipalWan || 1000, val));
                                      setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, amountWan: safeVal } : ev));
                                    }}
                                    className="w-12 text-right font-mono font-bold text-xs bg-transparent outline-hidden text-slate-800 dark:text-slate-200"
                                    min="1"
                                    max={remPrincipalWan || 100}
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">万元</span>
                                </div>
                              </div>

                              <input
                                type="range"
                                min="1"
                                max={remPrincipalWan || 100}
                                step="1"
                                value={event.amountWan > (remPrincipalWan || 100) ? (remPrincipalWan || 100) : event.amountWan}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, amountWan: val } : ev));
                                }}
                                className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                              />

                              {/* 还款后策略 */}
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">还款后调整方式</span>
                                <select
                                  value={event.strategy}
                                  onChange={(e) => {
                                    const strat = e.target.value as 'reduce_term' | 'reduce_payment';
                                    setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, strategy: strat } : ev));
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 px-2 text-[11px] font-bold rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                                >
                                  <option value="reduce_term">缩短还款期限 (最省利息)</option>
                                  <option value="reduce_payment">减少每月月供 (减轻负担)</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 bg-amber-50/10 p-2 rounded-lg">
                              📢 <strong>一次性全额结清</strong>将在上述节点直接清偿该月除正常月供外的全部剩余本金（约 <strong className="text-amber-600 dark:text-amber-400">¥{targetMonthDetail.remainingPrincipal.toLocaleString()} 元</strong>），此后不再产生任何后续贷款，全额省去剩余年份的所有利息。
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {prepayType === 'partial' && (
                    <button
                      type="button"
                      onClick={() => {
                        const lastEvent = prepayEvents[prepayEvents.length - 1];
                        const nextYear = Math.min(input.loanTermYears, (lastEvent?.yearNumber || 1) + 2);
                        setPrepayEvents([
                          ...prepayEvents,
                          {
                            id: Date.now().toString(),
                            monthIndex: (nextYear - 1) * 12 + 12,
                            yearNumber: nextYear,
                            monthInYear: 12,
                            amountWan: 10,
                            prepayType: 'partial',
                            strategy: 'reduce_term',
                          },
                        ]);
                      }}
                      className="w-full py-2 border border-dashed border-indigo-300 hover:border-indigo-500 dark:border-slate-750 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-350 flex items-center justify-center gap-1 transition-all bg-indigo-50/10 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加另一个提前还款时间点
                    </button>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-100/50 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 上一步
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      下一步 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Summary / Report */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      第3步：多重还贷向导方案报告
                    </h5>
                    <p className="text-[10px] text-slate-450">
                      分析结果已成功生成，方案详情如下：
                    </p>
                  </div>

                  {/* Highlight Summary Box */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/15 rounded-xl p-3 space-y-2 text-[11px] text-slate-750 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>多重方案试算收益概览：</span>
                    </div>
                    <div className="space-y-1.5 pl-5 text-slate-600 dark:text-slate-400 font-medium text-[10.5px]">
                      {prepayEvents.map((event, idx) => (
                        <p key={event.id}>
                          • 批次 #{idx + 1}: 在还贷第 <strong className="text-slate-800 dark:text-slate-200">{event.monthIndex} 期</strong> 后，还本 <strong className="text-indigo-600 dark:text-indigo-400">{event.prepayType === 'full' ? '一次性结清' : `${event.amountWan} 万元`}</strong>
                          {event.prepayType === 'partial' && (
                            <span>，调整为：<strong className="text-indigo-600 dark:text-indigo-400">{event.strategy === 'reduce_term' ? '缩短期限' : '减少月供'}</strong></span>
                          )}
                        </p>
                      ))}
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold border-t border-indigo-500/10 pt-1.5 mt-2">
                        💰 累计共节省利息支出: ¥{(activeSimResult.interestSaved / 10000).toFixed(2)}万!
                      </div>
                    </div>
                  </div>

                  {/* Method choices */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">选择您采用的计息月供方式：</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onActiveMethodChange(RepaymentMethod.EQUAL_PORTION)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          activeMethod === RepaymentMethod.EQUAL_PORTION
                            ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700 dark:text-indigo-400 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="text-xs block">等额本息</span>
                        <span className="text-[9px] text-slate-400 font-normal">等额月供固定</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onActiveMethodChange(RepaymentMethod.EQUAL_PRINCIPAL)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          activeMethod === RepaymentMethod.EQUAL_PRINCIPAL
                            ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700 dark:text-indigo-400 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="text-xs block">等额本金</span>
                        <span className="text-[9px] text-slate-400 font-normal">等额本金递减</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-100/50 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 上一步
                    </button>
                    <button
                      onClick={() => {
                        setWizardStep(1);
                        setPrepayEvents([
                          {
                            id: 'default',
                            monthIndex: (input.prepaymentYear - 1) * 12 + (input.prepaymentMonth % 12 || 12),
                            yearNumber: input.prepaymentYear,
                            monthInYear: (input.prepaymentMonth % 12 || 12),
                            amountWan: 10,
                            prepayType: 'partial',
                            strategy: 'reduce_term',
                          },
                        ]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      🔄 重置向导
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 专家手动微调 (Expert Mode)
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    1. 提前还贷类型选择
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">
                    专家模式
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setPrepayType('partial');
                      setPrepayEvents(prepayEvents.map(e => ({ ...e, prepayType: 'partial' })));
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                      prepayType === 'partial'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    部分提前还款
                  </button>
                  <button
                    onClick={() => {
                      setPrepayType('full');
                      setPrepayEvents([{
                        id: 'default_full',
                        monthIndex: prepayEvents[0]?.monthIndex || 36,
                        yearNumber: prepayEvents[0]?.yearNumber || 3,
                        monthInYear: prepayEvents[0]?.monthInYear || 12,
                        amountWan: 0,
                        prepayType: 'full',
                        strategy: 'reduce_term'
                      }]);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                      prepayType === 'full'
                        ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-extrabold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    一次性全额结清
                  </button>
                </div>
              </div>

              {/* Display multiple events details */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {prepayEvents.map((event, idx) => {
                  const targetMonthDetail = originalDetails[event.monthIndex - 1] || originalDetails[originalDetails.length - 1] || { remainingPrincipal: 0 };
                  const remPrincipalWan = Math.floor(targetMonthDetail.remainingPrincipal / 10000);

                  return (
                    <div key={event.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-750 rounded-xl p-3 space-y-2.5 relative">
                      <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-700 pb-1.5">
                        <span className="text-[10px] font-black text-slate-500">
                          设置 #{idx + 1} (第{event.monthIndex}期)
                        </span>
                        {prepayType === 'partial' && prepayEvents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPrepayEvents(prepayEvents.filter(e => e.id !== event.id));
                            }}
                            className="text-red-500 hover:text-red-600 text-[10px] font-bold flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 删除
                          </button>
                        )}
                      </div>

                      {/* Time point fine tuning */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block mb-0.5">年份点</span>
                          <select
                            value={event.yearNumber}
                            onChange={(e) => {
                              const y = parseInt(e.target.value);
                              const mIndex = (y - 1) * 12 + event.monthInYear;
                              setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, yearNumber: y, monthIndex: mIndex } : ev));
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1 px-1.5 text-[11px] rounded-lg text-slate-800 dark:text-slate-200"
                          >
                            {Array.from({ length: input.loanTermYears }, (_, i) => i + 1).map((y) => (
                              <option key={y} value={y}>
                                第 {y} 年
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block mb-0.5">月份点</span>
                          <select
                            value={event.monthInYear}
                            onChange={(e) => {
                              const m = parseInt(e.target.value);
                              const mIndex = (event.yearNumber - 1) * 12 + m;
                              setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, monthInYear: m, monthIndex: mIndex } : ev));
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1 px-1.5 text-[11px] rounded-lg text-slate-800 dark:text-slate-200"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m}>
                                第 {m} 月
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {prepayType === 'partial' ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-bold">还贷本金</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-750">
                              <input
                                type="number"
                                value={event.amountWan}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const safeVal = Math.max(1, Math.min(remPrincipalWan || 1000, val));
                                  setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, amountWan: safeVal } : ev));
                                }}
                                className="w-10 text-right font-mono font-bold text-xs bg-transparent outline-hidden text-slate-800 dark:text-slate-200"
                                min="1"
                                max={remPrincipalWan || 100}
                              />
                              <span className="text-[10px] font-bold text-slate-400">万元</span>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max={remPrincipalWan || 100}
                            step="1"
                            value={event.amountWan > (remPrincipalWan || 100) ? (remPrincipalWan || 100) : event.amountWan}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, amountWan: val } : ev));
                            }}
                            className="w-full accent-blue-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                          />

                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block mb-0.5">还款后调整方式</span>
                            <select
                              value={event.strategy}
                              onChange={(e) => {
                                const strat = e.target.value as 'reduce_term' | 'reduce_payment';
                                setPrepayEvents(prepayEvents.map(ev => ev.id === event.id ? { ...ev, strategy: strat } : ev));
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1 px-1.5 text-[10px] font-bold rounded-lg text-slate-800 dark:text-slate-200"
                            >
                              <option value="reduce_term">缩短还款期限 (最省利息)</option>
                              <option value="reduce_payment">减少每月供额 (减轻压力)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 leading-relaxed bg-white dark:bg-slate-900/55 p-2 rounded-lg">
                          一次性全额还清，在该点直接偿还剩余全部本金 ¥{targetMonthDetail.remainingPrincipal.toLocaleString()} 元。
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {prepayType === 'partial' && (
                <button
                  type="button"
                  onClick={() => {
                    const lastEvent = prepayEvents[prepayEvents.length - 1];
                    const nextYear = Math.min(input.loanTermYears, (lastEvent?.yearNumber || 1) + 2);
                    setPrepayEvents([
                      ...prepayEvents,
                      {
                        id: Date.now().toString(),
                        monthIndex: (nextYear - 1) * 12 + 12,
                        yearNumber: nextYear,
                        monthInYear: 12,
                        amountWan: 10,
                        prepayType: 'partial',
                        strategy: 'reduce_term',
                      },
                    ]);
                  }}
                  className="w-full py-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1 transition-all bg-slate-50/50"
                >
                  <Plus className="w-3.5 h-3.5" /> 添加另一个提前还款设置
                </button>
              )}
            </div>
          )}
        </div>

        {/* 模拟结果输出 */}
        <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-5 border border-slate-200/40 dark:border-slate-700/40 flex flex-col justify-between">
          <div>
            <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-block">
              实时方案试算结果
            </span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              {activeMethod === RepaymentMethod.EQUAL_PORTION ? '【等额本息】' : '【等额本金】'}提前还贷收益分析
            </h4>

            {/* 结果指标数据 */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">
                  新总利息额支出
                </span>
                <span className="text-base font-mono font-black text-slate-700 dark:text-slate-300">
                  ¥{(activeSimResult.newTotalInterest / 10000).toFixed(2)}万
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  原计划利息: ¥{(currentSummary.totalInterest / 10000).toFixed(2)}万
                </span>
              </div>

              <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.08] border border-emerald-500/10 p-3.5 rounded-xl">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-0.5">
                  <Coins className="w-3.5 h-3.5" />
                  累计省下利息总额
                </span>
                <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                  ¥{(activeSimResult.interestSaved / 10000).toFixed(2)}万
                </span>
                <span className="text-[9px] text-emerald-500/80 block mt-0.5">
                  省下人民币 {Math.round(activeSimResult.interestSaved).toLocaleString()} 元
                </span>
              </div>
            </div>

            {/* 核心对比数据表格 */}
            <div className="mt-5 overflow-x-auto border border-slate-200/50 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50">
              <table className="w-full text-xs text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-800">
                    <th className="py-2.5 px-3">比较维度</th>
                    <th className="py-2.5 px-3 text-right">原还款计划</th>
                    <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">提前还贷新方案</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">节省 / 变化</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
                  {/* 提前还本金额 */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">① 提前还本金</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">¥0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {prepayType === 'full' ? '一次性全额结清' : `¥${(totalExtraAmountWan * 10000).toLocaleString()} 元`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-600 dark:text-amber-400 font-mono">
                      {prepayType === 'full' ? '一次结清' : `累计偿还 ${totalExtraAmountWan} 万`}
                    </td>
                  </tr>

                  {/* 累计还款总额 */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">② 还款本息合计</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ¥{Math.round(currentSummary.totalRepayment).toLocaleString()} 元
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                      ¥{Math.round(activeSimResult.newTotalInterest + input.loanAmount * 10000).toLocaleString()} 元
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      - ¥{Math.round(activeSimResult.interestSaved).toLocaleString()} 元
                    </td>
                  </tr>

                  {/* 支付利息总额 */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">③ 支付纯利支出</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ¥{Math.round(currentSummary.totalInterest).toLocaleString()} 元
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                      ¥{Math.round(activeSimResult.newTotalInterest).toLocaleString()} 元
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04]">
                      - ¥{Math.round(activeSimResult.interestSaved).toLocaleString()} 元
                    </td>
                  </tr>

                  {/* 还款期数/年限 */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">④ 还款还贷年限</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {totalMonths} 期 ({(totalMonths / 12).toFixed(0)} 年)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                      {prepayType === 'full' 
                        ? `${firstPrepayMonth} 期 (约 ${(firstPrepayMonth / 12).toFixed(1)} 年)`
                        : `${firstPrepayMonth + activeSimResult.newRemainingMonths} 期 (约 ${((firstPrepayMonth + activeSimResult.newRemainingMonths) / 12).toFixed(1)} 年)`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {prepayType === 'full' ? (
                        `减少 ${totalMonths - firstPrepayMonth} 期`
                      ) : activeStrategy === 'reduce_term' ? (
                        `缩短约 ${Math.round((totalMonths - firstPrepayMonth - activeSimResult.newRemainingMonths) / 12 * 10) / 10} 年`
                      ) : (
                        '年限不变 (0期)'
                      )}
                    </td>
                  </tr>

                  {/* 变更后下期月供 */}
                  {prepayType === 'partial' && (
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">⑤ 首次变更后月供</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        ¥{Math.round(currentSummary.monthlyPaymentFirst).toLocaleString()}
                        <span className="text-[10px] text-slate-400 ml-0.5">/月</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-extrabold">
                        ¥{Math.round(activeSimResult.newDetails[firstPrepayMonth]?.monthlyPayment || 0).toLocaleString()}
                        <span className="text-[10px] text-blue-500 ml-0.5">/月</span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        activeStrategy === 'reduce_payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        {activeStrategy === 'reduce_payment' ? (
                          `- ¥${Math.round(currentSummary.monthlyPaymentFirst - (activeSimResult.newDetails[firstPrepayMonth]?.monthlyPayment || 0)).toLocaleString()} 元`
                        ) : (
                          '基本不变'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-[11px] text-slate-500 leading-relaxed">
            🚀 <strong>理财小常识：</strong> 提前还贷越早，能省下来的利息就越丰厚。因为银行利息是按天/月根据您剩余本金滚存计算的。当您大幅偿还本金后，剩余本金变少，后期滚存产生的利息会暴跌。
          </div>
        </div>
      </div>
    </div>
  );
}
