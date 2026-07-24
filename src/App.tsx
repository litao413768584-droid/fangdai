/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { LoanInput, RepaymentMethod, ComparisonSummary } from './types';
import { getComparison, PrepaymentSimulationResult } from './utils';
import { LoanInputForm } from './components/LoanInputForm';
import { ComparisonCards } from './components/ComparisonCards';
import { VisualCharts } from './components/VisualCharts';
import { PrepaymentSandbox } from './components/PrepaymentSandbox';
import { AmortizationTable } from './components/AmortizationTable';
import { PWAPrompt } from './components/PWAPrompt';
import { Landmark, Sparkles, Scale, Percent, Clock, Calculator, ShieldAlert, ArrowUpRight, Sun, Moon } from 'lucide-react';

export default function App() {
  // 深色模式状态初始化与本地持久化
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 同步到 HTML root 元素的 class 属性
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // 默认初始贷款信息：100万、20年、3.5%利率、第3年第12个月提前还款
  const [loanInput, setLoanInput] = useState<LoanInput>({
    loanAmount: 100,
    loanTermYears: 20,
    annualRate: 3.5,
    prepaymentYear: 3,
    prepaymentMonth: 36,
  });

  // 提前还款沙盒返回的模拟结果状态
  const [portionSimResult, setPortionSimResult] = useState<PrepaymentSimulationResult | null>(null);
  const [principalSimResult, setPrincipalSimResult] = useState<PrepaymentSimulationResult | null>(null);
  const [activeRepaymentMethod, setActiveRepaymentMethod] = useState<RepaymentMethod>(RepaymentMethod.EQUAL_PORTION);

  // 1. 实时的基础对比计算
  const comparison: ComparisonSummary = useMemo(() => {
    return getComparison(loanInput.loanAmount, loanInput.loanTermYears, loanInput.annualRate);
  }, [loanInput.loanAmount, loanInput.loanTermYears, loanInput.annualRate]);

  // 处理提前还贷模拟结果的同步
  const handleSimulationChange = (
    portionSim: PrepaymentSimulationResult,
    principalSim: PrepaymentSimulationResult,
    activeMethod: RepaymentMethod
  ) => {
    setPortionSimResult(portionSim);
    setPrincipalSimResult(principalSim);
    setActiveRepaymentMethod(activeMethod);
  };

  // 根据当前沙盒激活的方式，选择传给表格的原装明细与提前还款后明细
  const currentOriginalDetails = useMemo(() => {
    return activeRepaymentMethod === RepaymentMethod.EQUAL_PORTION
      ? comparison.equalPortion.monthlyPaymentDetail
      : comparison.equalPrincipal.monthlyPaymentDetail;
  }, [comparison, activeRepaymentMethod]);

  const currentAdjustedDetails = useMemo(() => {
    if (activeRepaymentMethod === RepaymentMethod.EQUAL_PORTION) {
      return portionSimResult ? portionSimResult.newDetails : comparison.equalPortion.monthlyPaymentDetail;
    } else {
      return principalSimResult ? principalSimResult.newDetails : comparison.equalPrincipal.monthlyPaymentDetail;
    }
  }, [comparison, portionSimResult, principalSimResult, activeRepaymentMethod]);

  const activeMethodName = activeRepaymentMethod === RepaymentMethod.EQUAL_PORTION ? '等额本息 (每月还款固定)' : '等额本金 (每月还款递减)';

  const activePrepayEvents = useMemo(() => {
    return activeRepaymentMethod === RepaymentMethod.EQUAL_PORTION
      ? portionSimResult?.prepayEvents
      : principalSimResult?.prepayEvents;
  }, [portionSimResult, principalSimResult, activeRepaymentMethod]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* 顶部高端导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                房贷计算与提前还款对比工具
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-md font-bold">
                  2026专业版
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                等额本金 / 等额本息双向比对 · 提前还款周期精细测算 · 已还与剩余本息一目了然
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* LPR 利率提示小贴士 */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>2026年最新房贷基准利率参考（LPR）：<strong>3.1% ~ 3.85%</strong> 左右</span>
            </div>

            {/* 深色模式切换按钮 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center shadow-xs hover:scale-105 active:scale-95"
              aria-label="Toggle dark mode"
              title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 主页面主体 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 精美大横幅介绍 */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
          {/* 背景装饰光晕 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5" /> 智能全景试算
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              告别繁琐公式，直观掌控您的资产负债
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              输入您的贷款本金、年限与商贷利率，本工具为您一键生成等额本息和等额本金的深度对照。特别支持
              <span className="text-amber-400 font-bold">“中途提前还贷”</span>
              沙盒模拟，自动帮您清算出提前还贷那一天您一共还了多少冤枉利息，还剩多少本金，并推演未来的本息结转与缩期表现。
            </p>
          </div>
        </div>

        {/* 第一步：基础配置输入面板 */}
        <section id="loan-inputs">
          <LoanInputForm input={loanInput} onChange={setLoanInput} />
        </section>

        {/* 核心比对汇总面板 */}
        <section id="loan-comparison">
          <ComparisonCards comparison={comparison} loanInput={loanInput} />
        </section>

        {/* 动态可视化折线图 */}
        <section id="visual-charts">
          <VisualCharts
            equalPortion={comparison.equalPortion}
            equalPrincipal={comparison.equalPrincipal}
            prepaymentMonth={loanInput.prepaymentMonth}
          />
        </section>

        {/* 第二步：提前还款沙盒 */}
        <section id="prepayment-sandbox">
          <PrepaymentSandbox
            input={loanInput}
            equalPortion={comparison.equalPortion}
            equalPrincipal={comparison.equalPrincipal}
            activeMethod={activeRepaymentMethod}
            onActiveMethodChange={setActiveRepaymentMethod}
            onSimulationChange={handleSimulationChange}
            onLoanInputUpdate={setLoanInput}
          />
        </section>

        {/* 第三步：每月还款明细单 */}
        <section id="amortization-table">
          <AmortizationTable
            originalDetails={currentOriginalDetails}
            adjustedDetails={currentAdjustedDetails}
            prepayEvents={activePrepayEvents}
            repaymentMethodName={activeMethodName}
            activeRepaymentMethod={activeRepaymentMethod}
            onRepaymentMethodChange={setActiveRepaymentMethod}
          />
        </section>
      </main>

      {/* 底部声明信息 */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-sm font-black text-slate-300">房贷计算与提前还款对比工具</span>
            <p className="text-[11px] text-slate-500">
              © 2026 Mortgage Calculations & Prepayment sandbox. All rights reserved.
            </p>
          </div>
          <div className="text-[11px] text-slate-500 text-center md:text-right max-w-md leading-relaxed">
            * 声明：本计算工具产出数据仅供学术或财务推演参考。由于各省市公积金管理中心、各商业银行对于尾期零差、扣息日、提前还贷收费或审核期有各自规定，实际交款账单请以经办银行出具的纸质 or 网银交费凭证为准。
          </div>
        </div>
      </footer>

      {/* PWA 离线使用悬浮提示与安装向导 */}
      <PWAPrompt />
    </div>
  );
}
