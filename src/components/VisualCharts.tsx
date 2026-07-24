/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MonthDetail, LoanResultSummary } from '../types';

interface VisualChartsProps {
  equalPortion: LoanResultSummary;
  equalPrincipal: LoanResultSummary;
  prepaymentMonth: number;
}

export function VisualCharts({ equalPortion, equalPrincipal, prepaymentMonth }: VisualChartsProps) {
  const portionDetails = equalPortion.monthlyPaymentDetail;
  const principalDetails = equalPrincipal.monthlyPaymentDetail;
  const totalMonths = portionDetails.length;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (totalMonths === 0) return null;

  // 1. 每月还款额对比曲线参数计算
  const maxPayment = Math.max(
    principalDetails[0]?.monthlyPayment || 0,
    portionDetails[0]?.monthlyPayment || 0
  );
  const minPayment = Math.min(
    principalDetails[totalMonths - 1]?.monthlyPayment || 0,
    portionDetails[totalMonths - 1]?.monthlyPayment || 0
  );

  // SVG dimensions
  const width = 600;
  const height = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 将月供数值映射到 Y 轴坐标
  const getY = (val: number) => {
    if (maxPayment === 0) return height - paddingBottom;
    // 留出 10% 的上方裕量
    const yRatio = (val / (maxPayment * 1.1));
    return height - paddingBottom - yRatio * chartHeight;
  };

  // 将月份索引映射到 X 轴坐标
  const getX = (idx: number) => {
    if (totalMonths <= 1) return paddingLeft;
    return paddingLeft + (idx / (totalMonths - 1)) * chartWidth;
  };

  // 生成折线 Path 的 d 属性
  const generatePathD = (details: MonthDetail[]) => {
    if (details.length === 0) return '';
    return details.reduce((acc, item, idx) => {
      const x = getX(idx);
      const y = getY(item.monthlyPayment);
      return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  const portionPathD = generatePathD(portionDetails);
  const principalPathD = generatePathD(principalDetails);

  // 渲染网格线和 Y 轴刻度
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxPayment * 1.1 * i) / yTicks);

  // 渲染 X 轴刻度 (5个刻度: 开始, 1/4, 1/2, 3/4, 结束)
  const xTickIndices = [
    0,
    Math.floor(totalMonths * 0.25),
    Math.floor(totalMonths * 0.5),
    Math.floor(totalMonths * 0.75),
    totalMonths - 1,
  ].filter((v) => v < totalMonths);

  // 计算当前的 hover 数据
  const currentPortionHover = hoverIndex !== null ? portionDetails[hoverIndex] : null;
  const currentPrincipalHover = hoverIndex !== null ? principalDetails[hoverIndex] : null;

  // 2. 还款本息占比计算
  const portionTotal = equalPortion.totalRepayment;
  const portionInterest = equalPortion.totalInterest;
  const portionPrincipal = portionTotal - portionInterest;

  const principalTotal = equalPrincipal.totalRepayment;
  const principalInterest = equalPrincipal.totalInterest;
  const principalPrincipal = principalTotal - principalInterest;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* 曲线图 */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
              每月还款变化曲线对比
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              横轴为期数(月)，纵轴为月供金额(元)。移动鼠标查看详情。
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-500 rounded-full inline-block"></span>
              <span className="text-slate-600 dark:text-slate-400">等额本息</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
              <span className="text-slate-600 dark:text-slate-400">等额本金</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full overflow-hidden" id="payment-curve-chart">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
            onMouseMove={(e) => {
              const svgEl = e.currentTarget;
              const rect = svgEl.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              // 计算相对于 SVG 的比例坐标
              const svgX = (clientX / rect.width) * width;
              const relativeX = svgX - paddingLeft;
              if (relativeX >= 0 && relativeX <= chartWidth) {
                const fraction = relativeX / chartWidth;
                const idx = Math.min(totalMonths - 1, Math.max(0, Math.round(fraction * (totalMonths - 1))));
                setHoverIndex(idx);
              } else {
                setHoverIndex(null);
              }
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Y轴背景网格线与刻度 */}
            {yTickValues.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx} className="opacity-40 dark:opacity-20">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    className="font-mono"
                  >
                    {Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* X轴刻度 */}
            {xTickIndices.map((idx) => {
              const x = getX(idx);
              return (
                <g key={idx} className="opacity-70">
                  <line
                    x1={x}
                    y1={height - paddingBottom}
                    x2={x}
                    y2={height - paddingBottom + 5}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={height - paddingBottom + 18}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    第 {idx + 1} 期
                  </text>
                </g>
              );
            })}

            {/* 折线图: 等额本息 (Blue) */}
            <path
              d={portionPathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 折线图: 等额本金 (Emerald) */}
            <path
              d={principalPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover 指示器线与圆点 */}
            {hoverIndex !== null && currentPortionHover && currentPrincipalHover && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={paddingTop}
                  x2={getX(hoverIndex)}
                  y2={height - paddingBottom}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {/* 等额本息圆点 */}
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(currentPortionHover.monthlyPayment)}
                  r="6"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />
                {/* 等额本金圆点 */}
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(currentPrincipalHover.monthlyPayment)}
                  r="6"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />
              </g>
            )}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoverIndex !== null && currentPortionHover && currentPrincipalHover && (
            <div
              className="absolute z-10 bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1.5 border border-slate-700/50 backdrop-blur-xs pointer-events-none"
              style={{
                left: `${Math.min(
                  width - 150,
                  Math.max(10, (getX(hoverIndex) / width) * 100)
                )}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold text-center border-b border-slate-700 pb-1 mb-1 text-[11px] text-slate-300">
                第 {hoverIndex + 1} 期 ({currentPortionHover.yearNumber}年第{currentPortionHover.monthInYear}月)
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  等额本息:
                </span>
                <span className="font-mono font-bold">¥{currentPortionHover.monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-2.5 flex flex-col">
                <span>本金: ¥{currentPortionHover.principalPaid.toLocaleString()}</span>
                <span>利息: ¥{currentPortionHover.interestPaid.toLocaleString()}</span>
              </div>

              <div className="flex justify-between gap-6 mt-1 border-t border-slate-800 pt-1">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  等额本金:
                </span>
                <span className="font-mono font-bold">¥{currentPrincipalHover.monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-2.5 flex flex-col">
                <span>本金: ¥{currentPrincipalHover.principalPaid.toLocaleString()}</span>
                <span>利息: ¥{currentPrincipalHover.interestPaid.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 还款结构比例对比 (Bento Column) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-sm"></span>
              还款总额结构对比
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              对比两种贷款方式产生的利息与本金比例。
            </p>
          </div>

          <div className="space-y-6 my-4">
            {/* 等额本息 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-sm"></span>
                  等额本息 (总还 ¥{(portionTotal / 10000).toFixed(2)}万)
                </span>
                <span className="text-slate-500 font-normal">
                  利息占比 {((portionInterest / portionTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex text-white text-[10px] font-mono font-bold">
                <div
                  className="bg-blue-600 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(portionPrincipal / portionTotal) * 100}%` }}
                  title={`本金: ¥${(portionPrincipal/10000).toFixed(1)}万`}
                >
                  本金
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(portionInterest / portionTotal) * 100}%` }}
                  title={`利息: ¥${(portionInterest/10000).toFixed(1)}万`}
                >
                  利息
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>本金: ¥{(portionPrincipal / 10000).toFixed(2)}万</span>
                <span>利息: ¥{(portionInterest / 10000).toFixed(2)}万</span>
              </div>
            </div>

            {/* 等额本金 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                  等额本金 (总还 ¥{(principalTotal / 10000).toFixed(2)}万)
                </span>
                <span className="text-slate-500 font-normal">
                  利息占比 {((principalInterest / principalTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex text-white text-[10px] font-mono font-bold">
                <div
                  className="bg-emerald-600 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(principalPrincipal / principalTotal) * 100}%` }}
                  title={`本金: ¥${(principalPrincipal/10000).toFixed(1)}万`}
                >
                  本金
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(principalInterest / principalTotal) * 100}%` }}
                  title={`利息: ¥${(principalInterest/10000).toFixed(1)}万`}
                >
                  利息
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>本金: ¥{(principalPrincipal / 10000).toFixed(2)}万</span>
                <span>利息: ¥{(principalInterest / 10000).toFixed(2)}万</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl p-3 text-center">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium block">
              💡 纯利息省下额
            </span>
            <span className="text-lg font-mono font-black text-amber-600 dark:text-amber-400 block mt-1">
              ¥{Math.round(portionInterest - principalInterest).toLocaleString()} 元
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              等额本金还款法可累计省下约{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {((portionInterest - principalInterest) / 10000).toFixed(2)}万
              </strong>{' '}
              利息支出。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
