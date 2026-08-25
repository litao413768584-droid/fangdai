/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { SavedPlan, PlanColorTag } from '../types';
import { getComparison } from '../utils';
import { 
  Scale, 
  X, 
  Check, 
  ArrowRight, 
  Trophy, 
  Sparkles, 
  TrendingDown, 
  Coins, 
  CheckCircle2, 
  Plus,
  Percent,
  Calendar,
  Wallet
} from 'lucide-react';

interface PlanComparisonMatrixProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SavedPlan[];
  selectedPlanIds: string[];
  onToggleSelectPlan: (id: string) => void;
  onApplyPlan: (plan: SavedPlan) => void;
  activePlanId?: string;
}

const COLOR_MAP: Record<PlanColorTag, { badgeBg: string; text: string; border: string }> = {
  blue: { badgeBg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  emerald: { badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  indigo: { badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  purple: { badgeBg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  amber: { badgeBg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  rose: { badgeBg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
};

export function PlanComparisonMatrix({
  isOpen,
  onClose,
  plans,
  selectedPlanIds,
  onToggleSelectPlan,
  onApplyPlan,
  activePlanId,
}: PlanComparisonMatrixProps) {
  // 选中的对比方案列表 (过滤存在的)
  const comparedPlans = useMemo(() => {
    return plans.filter((p) => selectedPlanIds.includes(p.id));
  }, [plans, selectedPlanIds]);

  // 计算每个方案的计算结果
  const computedList = useMemo(() => {
    return comparedPlans.map((plan) => {
      const comp = getComparison(plan.input.loanAmount, plan.input.loanTermYears, plan.input.annualRate);
      return {
        plan,
        comp,
      };
    });
  }, [comparedPlans]);

  // 计算极值（最低利息、最低月供等）
  const highlights = useMemo(() => {
    if (computedList.length < 2) return null;

    let minEqualPortionInterest = Infinity;
    let minEqualPortionInterestPlanId = '';

    let minEqualPrincipalInterest = Infinity;
    let minEqualPrincipalInterestPlanId = '';

    let minMonthlyPayment = Infinity;
    let minMonthlyPaymentPlanId = '';

    computedList.forEach(({ plan, comp }) => {
      if (comp.equalPortion.totalInterest < minEqualPortionInterest) {
        minEqualPortionInterest = comp.equalPortion.totalInterest;
        minEqualPortionInterestPlanId = plan.id;
      }
      if (comp.equalPrincipal.totalInterest < minEqualPrincipalInterest) {
        minEqualPrincipalInterest = comp.equalPrincipal.totalInterest;
        minEqualPrincipalInterestPlanId = plan.id;
      }
      if (comp.equalPortion.monthlyPaymentFirst < minMonthlyPayment) {
        minMonthlyPayment = comp.equalPortion.monthlyPaymentFirst;
        minMonthlyPaymentPlanId = plan.id;
      }
    });

    return {
      minEqualPortionInterestPlanId,
      minEqualPrincipalInterestPlanId,
      minMonthlyPaymentPlanId,
    };
  }, [computedList]);

  // 格式化万元
  const formatWan = (yuan: number) => {
    return (yuan / 10000).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:px-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  多方案横向深度对比矩阵
                </h3>
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                  已选 {comparedPlans.length} 个方案
                </span>
              </div>
              <p className="text-xs text-slate-400">
                对比不同贷款额度、期限及利率下的月供负担与利息损耗差异，助您挑选最优借贷模型
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan selector bar */}
        <div className="px-5 sm:px-8 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs shrink-0">
          <span className="font-bold text-slate-500 mr-1">选择对比方案:</span>
          {plans.map((p) => {
            const isChecked = selectedPlanIds.includes(p.id);
            const color = COLOR_MAP[p.colorTag || 'blue'];
            return (
              <button
                key={p.id}
                onClick={() => onToggleSelectPlan(p.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isChecked
                    ? `${color.badgeBg} ${color.text} ${color.border} shadow-xs`
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-8 custom-scrollbar">
          {comparedPlans.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Scale className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-600 dark:text-slate-300">
                请先勾选至少 2 个需要对比的方案
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                在上方方案列表中点击勾选您保存的贷款配置，即刻生成直观的多维横向比对矩阵
              </p>
            </div>
          ) : (
            <div className="space-y-6 min-w-[650px]">
              {/* Matrix Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Table Header: Plan Names */}
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 w-44 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        方案比对维度
                      </th>
                      {computedList.map(({ plan }) => {
                        const color = COLOR_MAP[plan.colorTag || 'blue'];
                        const isActive = plan.id === activePlanId;
                        return (
                          <th key={plan.id} className="p-4 border-l border-slate-200 dark:border-slate-700">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-bold text-sm text-slate-800 dark:text-white truncate block max-w-[170px]`}>
                                  {plan.name}
                                </span>
                                {isActive && (
                                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                                    当前应用
                                  </span>
                                )}
                              </div>
                              {plan.note && (
                                <p className="text-[11px] text-slate-400 font-normal line-clamp-1">
                                  {plan.note}
                                </p>
                              )}
                              <button
                                onClick={() => {
                                  onApplyPlan(plan);
                                  onClose();
                                }}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                                  isActive
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-default'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                                }`}
                              >
                                {isActive ? '正在使用此方案' : '载入此方案计算'}
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Section 1: 核心基础参数 */}
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      <td colSpan={computedList.length + 1} className="py-2 px-4 text-blue-600 dark:text-blue-400">
                        一、基础借款条件
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        贷款本金 (总额)
                      </td>
                      {computedList.map(({ plan }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                          {plan.input.loanAmount} <span className="text-xs font-normal text-slate-400">万元</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        贷款年限 / 期数
                      </td>
                      {computedList.map(({ plan }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {plan.input.loanTermYears} 年 <span className="text-xs font-normal text-slate-400">({plan.input.loanTermYears * 12} 期)</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        执行年利率
                      </td>
                      {computedList.map(({ plan }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                          {plan.input.annualRate} %
                        </td>
                      ))}
                    </tr>

                    {/* Section 2: 等额本息对比 */}
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold text-[11px]">
                      <td colSpan={computedList.length + 1} className="py-2 px-4 text-blue-700 dark:text-blue-300">
                        二、等额本息还款模型 (每月还款额固定)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        每月固定月供
                      </td>
                      {computedList.map(({ plan, comp }) => {
                        const isLowest = highlights?.minMonthlyPaymentPlanId === plan.id;
                        return (
                          <td key={plan.id} className={`p-4 border-l border-slate-100 dark:border-slate-800 ${isLowest ? 'bg-blue-50/60 dark:bg-blue-950/40' : ''}`}>
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                              ¥{Math.round(comp.equalPortion.monthlyPaymentFirst).toLocaleString()} <span className="text-xs font-normal">/月</span>
                            </div>
                            {isLowest && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                <Trophy className="w-3 h-3" /> 最低月供门槛
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        等额本息累计利息
                      </td>
                      {computedList.map(({ plan, comp }) => {
                        const isLowest = highlights?.minEqualPortionInterestPlanId === plan.id;
                        return (
                          <td key={plan.id} className={`p-4 border-l border-slate-100 dark:border-slate-800 ${isLowest ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''}`}>
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                              ¥{formatWan(comp.equalPortion.totalInterest)} <span className="text-xs font-normal text-slate-400">万元</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ({Math.round(comp.equalPortion.totalInterest).toLocaleString()} 元)
                            </span>
                            {isLowest && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <Sparkles className="w-3 h-3" /> 本息模式利息最低
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        等额本息还款总额
                      </td>
                      {computedList.map(({ plan, comp }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                          ¥{formatWan(comp.equalPortion.totalRepayment)} 万元
                        </td>
                      ))}
                    </tr>

                    {/* Section 3: 等额本金对比 */}
                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-[11px]">
                      <td colSpan={computedList.length + 1} className="py-2 px-4 text-emerald-700 dark:text-emerald-300">
                        三、等额本金还款模型 (每月月供逐月递减)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        首月月供 → 末月月供
                      </td>
                      {computedList.map(({ plan, comp }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            ¥{Math.round(comp.equalPrincipal.monthlyPaymentFirst).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ↓ 递减至 ¥{Math.round(comp.equalPrincipal.monthlyPaymentLast).toLocaleString()}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        等额本金累计利息
                      </td>
                      {computedList.map(({ plan, comp }) => {
                        const isLowest = highlights?.minEqualPrincipalInterestPlanId === plan.id;
                        return (
                          <td key={plan.id} className={`p-4 border-l border-slate-100 dark:border-slate-800 ${isLowest ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''}`}>
                            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ¥{formatWan(comp.equalPrincipal.totalInterest)} <span className="text-xs font-normal">万元</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ({Math.round(comp.equalPrincipal.totalInterest).toLocaleString()} 元)
                            </span>
                            {isLowest && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <Trophy className="w-3 h-3" /> 全场利息最省
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        等额本金净省利息
                      </td>
                      {computedList.map(({ plan, comp }) => (
                        <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold text-amber-600 dark:text-amber-400">
                          ¥{formatWan(comp.interestSavedByPrincipal)} 万元
                        </td>
                      ))}
                    </tr>

                    {/* Section 4: 相比方案1的差额对比 */}
                    {computedList.length >= 2 && (
                      <>
                        <tr className="bg-purple-50/40 dark:bg-purple-950/20 font-bold text-[11px]">
                          <td colSpan={computedList.length + 1} className="py-2 px-4 text-purple-700 dark:text-purple-300">
                            四、相对基准差异 (以【{computedList[0].plan.name}】为基准)
                          </td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                            月供差额 (等额本息)
                          </td>
                          {computedList.map(({ plan, comp }, idx) => {
                            if (idx === 0) {
                              return (
                                <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 text-slate-400 italic">
                                  基准方案
                                </td>
                              );
                            }
                            const diff = comp.equalPortion.monthlyPaymentFirst - computedList[0].comp.equalPortion.monthlyPaymentFirst;
                            const isHigher = diff > 0;
                            return (
                              <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold">
                                <span className={isHigher ? 'text-rose-500' : 'text-emerald-500'}>
                                  {isHigher ? `+¥${Math.round(diff).toLocaleString()}` : `-¥${Math.round(Math.abs(diff)).toLocaleString()}`} /月
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                            总利息差额 (等额本息)
                          </td>
                          {computedList.map(({ plan, comp }, idx) => {
                            if (idx === 0) {
                              return (
                                <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 text-slate-400 italic">
                                  基准方案
                                </td>
                              );
                            }
                            const diff = comp.equalPortion.totalInterest - computedList[0].comp.equalPortion.totalInterest;
                            const isHigher = diff > 0;
                            return (
                              <td key={plan.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono font-bold">
                                <span className={isHigher ? 'text-rose-500' : 'text-emerald-500'}>
                                  {isHigher ? `+${formatWan(diff)} 万` : `-${formatWan(Math.abs(diff))} 万`}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Quick Summary Tips */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">💡 方案对比决策指引：</span>
                <p>
                  • <strong>利率敏感度</strong>：贷款金额越大、年限越长，每 0.1% 的利率浮动带来的利息总额差异可达数万元。
                </p>
                <p>
                  • <strong>年限选择权衡</strong>：选择较长年限（如30年）可显著降低每月强制月供压力，留出更多应急流动资金；若未来有提前还款预期，可随时通过沙盒提前还贷将年限缩短。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer"
          >
            完成对比并关闭
          </button>
        </div>
      </div>
    </div>
  );
}
