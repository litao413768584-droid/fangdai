/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { LoanInput, RepaymentMethod, ComparisonSummary, SavedPlan } from './types';
import { getComparison, PrepaymentSimulationResult } from './utils';
import { LoanInputForm } from './components/LoanInputForm';
import { ComparisonCards } from './components/ComparisonCards';
import { VisualCharts } from './components/VisualCharts';
import { PrepaymentSandbox } from './components/PrepaymentSandbox';
import { AmortizationTable } from './components/AmortizationTable';
import { PWAPrompt } from './components/PWAPrompt';
import { SavedPlanModal } from './components/SavedPlanModal';
import { SavedPlansDrawer } from './components/SavedPlansDrawer';
import { PlanComparisonMatrix } from './components/PlanComparisonMatrix';
import { QuickPlanSwitcher } from './components/QuickPlanSwitcher';
import { 
  Landmark, 
  Sparkles, 
  Scale, 
  Percent, 
  Clock, 
  Calculator, 
  ShieldAlert, 
  ArrowUpRight, 
  Sun, 
  Moon,
  FolderKanban,
  BookmarkPlus,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_PRESET_PLANS: SavedPlan[] = [
  {
    id: 'preset-1',
    name: '首套公积金/低息方案 (100万 · 20年 · 3.1%)',
    createdAt: Date.now() - 3600000 * 24 * 2,
    note: '公积金或低息自住房首套贷款，总利息支出低',
    colorTag: 'emerald',
    input: {
      loanAmount: 100,
      loanTermYears: 20,
      annualRate: 3.1,
      prepaymentYear: 3,
      prepaymentMonth: 36,
    },
  },
  {
    id: 'preset-2',
    name: '标准商业按揭方案 (120万 · 30年 · 3.5%)',
    createdAt: Date.now() - 3600000 * 24,
    note: '主流30年商业贷款，每月月供适中，资金占用较轻',
    colorTag: 'blue',
    input: {
      loanAmount: 120,
      loanTermYears: 30,
      annualRate: 3.5,
      prepaymentYear: 5,
      prepaymentMonth: 60,
    },
  },
  {
    id: 'preset-3',
    name: '改善型置业方案 (180万 · 25年 · 3.85%)',
    createdAt: Date.now() - 3600000 * 12,
    note: '较大金额改善型房贷，重点评估未来提前还贷时机',
    colorTag: 'amber',
    input: {
      loanAmount: 180,
      loanTermYears: 25,
      annualRate: 3.85,
      prepaymentYear: 3,
      prepaymentMonth: 36,
    },
  },
];

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

  // 方案库状态管理与本地持久化
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('saved_mortgage_plans_v1');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (err) {
          console.error('Failed to parse saved plans:', err);
        }
      }
    }
    return DEFAULT_PRESET_PLANS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_mortgage_plans_v1', JSON.stringify(savedPlans));
    }
  }, [savedPlans]);

  // 当前激活/匹配的方案 ID
  const [activePlanId, setActivePlanId] = useState<string | undefined>('preset-2');

  // 对比矩阵中勾选选中的方案 IDs
  const [selectedPlanIdsForComparison, setSelectedPlanIdsForComparison] = useState<string[]>(() => {
    return savedPlans.slice(0, 3).map((p) => p.id);
  });

  // 弹窗与抽屉控制
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isComparisonMatrixOpen, setIsComparisonMatrixOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<SavedPlan | null>(null);

  // 快速提示反馈
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 载入方案
  const handleApplyPlan = (plan: SavedPlan) => {
    setLoanInput({ ...plan.input });
    setActivePlanId(plan.id);
    showToast(`已成功载入方案「${plan.name}」`);
  };

  // 保存/新建方案
  const handleSavePlan = (planData: Omit<SavedPlan, 'id' | 'createdAt'>) => {
    if (editingPlan) {
      // 修改现有方案
      setSavedPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlan.id
            ? { ...p, ...planData, updatedAt: Date.now() }
            : p
        )
      );
      setEditingPlan(null);
      showToast(`已更新方案「${planData.name}」`);
    } else {
      // 新建方案
      const newPlan: SavedPlan = {
        ...planData,
        id: `plan-${Date.now()}`,
        createdAt: Date.now(),
      };
      setSavedPlans((prev) => [newPlan, ...prev]);
      setActivePlanId(newPlan.id);
      // 自动加入对比列表
      setSelectedPlanIdsForComparison((prev) => [...prev, newPlan.id]);
      showToast(`已成功保存「${newPlan.name}」至方案库`);
    }
  };

  // 删除方案
  const handleDeletePlan = (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    setSelectedPlanIdsForComparison((prev) => prev.filter((pid) => pid !== id));
    if (activePlanId === id) {
      setActivePlanId(undefined);
    }
    showToast('方案已从方案库删除');
  };

  // 复制方案
  const handleDuplicatePlan = (plan: SavedPlan) => {
    const clonedPlan: SavedPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (副本)`,
      createdAt: Date.now(),
    };
    setSavedPlans((prev) => [clonedPlan, ...prev]);
    showToast(`已创建方案副本「${clonedPlan.name}」`);
  };

  // 打开编辑
  const handleOpenEditPlan = (plan: SavedPlan) => {
    setEditingPlan(plan);
    setIsSaveModalOpen(true);
  };

  // 切换方案对比勾选状态
  const handleToggleSelectPlan = (id: string) => {
    setSelectedPlanIdsForComparison((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 恢复默认预设
  const handleResetDefaultPlans = () => {
    setSavedPlans(DEFAULT_PRESET_PLANS);
    setSelectedPlanIdsForComparison(DEFAULT_PRESET_PLANS.map((p) => p.id));
    showToast('已恢复系统示例方案库');
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative">
      {/* 浮动 Toast 提示 */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-fade-in border border-slate-800 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 顶部高端导航栏 */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  房贷计算与提前还款对比工具
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-md font-bold">
                    2026专业版
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  多方案多利率存取比对 · 等额本金/本息深度解析 · 提前还款沙盒测算
                </p>
              </div>
            </div>

            {/* Mobile dark mode & drawer shortcut */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="打开方案库"
              >
                <FolderKanban className="w-4 h-4" />
                <span>{savedPlans.length}</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 justify-end w-full md:w-auto">
            {/* 方案库与对比快捷主按钮 */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-2xs"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>方案库 ({savedPlans.length})</span>
            </button>

            {savedPlans.length >= 2 && (
              <button
                onClick={() => setIsComparisonMatrixOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 transition-all cursor-pointer shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>横向对比矩阵</span>
              </button>
            )}

            {/* LPR 利率提示小贴士 */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>最新LPR基准参考：<strong>3.1% ~ 3.85%</strong></span>
            </div>

            {/* 深色模式切换按钮 (Desktop) */}
            <button
              onClick={toggleDarkMode}
              className="hidden md:flex p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 transition-all cursor-pointer items-center justify-center shadow-xs hover:scale-105 active:scale-95"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 方案快捷切换条 (Quick Plan Switcher Bar) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl px-4 py-2.5 shadow-2xs">
          <QuickPlanSwitcher
            plans={savedPlans}
            activePlanId={activePlanId}
            onApplyPlan={handleApplyPlan}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenSaveModal={() => {
              setEditingPlan(null);
              setIsSaveModalOpen(true);
            }}
            onOpenComparisonMatrix={() => setIsComparisonMatrixOpen(true)}
            selectedPlanCount={selectedPlanIdsForComparison.length}
          />
        </section>

        {/* 精美大横幅介绍 */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg">
          {/* 背景装饰光晕 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5" /> 智能全景试算 · 多方案随时存取
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              告别繁琐公式，直观掌控您的资产负债
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              输入您的贷款本金、年限与利率，一键生成等额本息和等额本金深度对照。支持
              <span className="text-amber-400 font-bold">“保存当前方案”</span>
              方便在不同金额或利率组合间秒级切换和横向比对，并推演
              <span className="text-emerald-400 font-bold">“提前还款沙盒”</span>
              节省的利息与缩期效果。
            </p>
          </div>
        </div>

        {/* 第一步：基础配置输入面板 */}
        <section id="loan-inputs">
          <LoanInputForm
            input={loanInput}
            onChange={(newInput) => {
              setLoanInput(newInput);
              // 如果用户手动修改了参数，则标记当前为自定义状态
              setActivePlanId(undefined);
            }}
            onSavePlanClick={() => {
              setEditingPlan(null);
              setIsSaveModalOpen(true);
            }}
            onOpenDrawerClick={() => setIsDrawerOpen(true)}
            savedPlansCount={savedPlans.length}
          />
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
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-10 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-sm font-black text-slate-300">房贷计算与提前还款对比工具</span>
            <p className="text-[11px] text-slate-500">
              © 2026 Mortgage Calculations & Prepayment Sandbox. All rights reserved.
            </p>
          </div>
          <div className="text-[11px] text-slate-500 text-center md:text-right max-w-md leading-relaxed">
            * 声明：本计算工具产出数据仅供财务测算与推演参考。实际交款账单请以经办银行出具的纸质或网银实际扣费记录为准。
          </div>
        </div>
      </footer>

      {/* 方案库抽屉侧边栏 */}
      <SavedPlansDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        plans={savedPlans}
        activePlanId={activePlanId}
        onApplyPlan={handleApplyPlan}
        onDeletePlan={handleDeletePlan}
        onDuplicatePlan={handleDuplicatePlan}
        onEditPlan={handleOpenEditPlan}
        onOpenSaveModal={() => {
          setEditingPlan(null);
          setIsSaveModalOpen(true);
        }}
        selectedPlanIds={selectedPlanIdsForComparison}
        onToggleSelectPlan={handleToggleSelectPlan}
        onOpenComparisonMatrix={() => {
          setIsDrawerOpen(false);
          setIsComparisonMatrixOpen(true);
        }}
        onResetDefaultPlans={handleResetDefaultPlans}
      />

      {/* 保存/编辑方案弹窗 */}
      <SavedPlanModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setEditingPlan(null);
        }}
        currentInput={loanInput}
        onSave={handleSavePlan}
        editingPlan={editingPlan}
      />

      {/* 多方案横向深度对比矩阵弹窗 */}
      <PlanComparisonMatrix
        isOpen={isComparisonMatrixOpen}
        onClose={() => setIsComparisonMatrixOpen(false)}
        plans={savedPlans}
        selectedPlanIds={selectedPlanIdsForComparison}
        onToggleSelectPlan={handleToggleSelectPlan}
        onApplyPlan={handleApplyPlan}
        activePlanId={activePlanId}
      />

      {/* PWA 离线使用悬浮提示与安装向导 */}
      <PWAPrompt />
    </div>
  );
}
