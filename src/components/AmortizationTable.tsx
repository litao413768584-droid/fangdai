/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MonthDetail, RepaymentMethod, PrepaymentEvent } from '../types';
import { Search, Filter, FileSpreadsheet, Printer, Milestone, CheckCircle2 } from 'lucide-react';

interface AmortizationTableProps {
  originalDetails: MonthDetail[];
  adjustedDetails: MonthDetail[];
  prepayEvents?: PrepaymentEvent[];
  repaymentMethodName: string;
  activeRepaymentMethod: RepaymentMethod;
  onRepaymentMethodChange: (method: RepaymentMethod) => void;
}

export function AmortizationTable({
  originalDetails,
  adjustedDetails,
  prepayEvents = [],
  repaymentMethodName,
  activeRepaymentMethod,
  onRepaymentMethodChange,
}: AmortizationTableProps) {
  // 计划模式切换: 'original' (原还款计划), 'adjusted' (提前还款新计划)
  const [planMode, setPlanMode] = useState<'original' | 'adjusted'>('adjusted');

  // 年份过滤 (0代表显示全部)
  const [filterYear, setFilterYear] = useState<number>(0);
  // 检索关键字 (搜索期数)
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeDetails = planMode === 'original' ? originalDetails : adjustedDetails;
  const totalMonths = activeDetails.length;

  // 导出 CSV (Excel)
  const handleExportCSV = () => {
    const headers = [
      '期数',
      '时间节点',
      '月供金额(元)',
      '偿还本金(元)',
      '偿还利息(元)',
      '剩余本金(元)',
      '已还本金(元)',
      '已还利息(元)',
      '累计还款总额(元)',
      '节点说明'
    ];
    const rows = activeDetails.map(item => {
      const prepayAtThisMonth = planMode === 'adjusted' ? prepayEvents.find(e => e.monthIndex === item.monthIndex) : null;
      let note = '';
      if (prepayAtThisMonth) {
        note = prepayAtThisMonth.prepayType === 'full' 
          ? '提前还贷(一次性全额结清)' 
          : `提前还贷(额外还本¥${prepayAtThisMonth.amountWan}万)`;
      } else if (item.monthIndex === activeDetails.length && item.remainingPrincipal === 0) {
        note = '贷款结清期';
      }

      return [
        item.monthIndex,
        `第${item.yearNumber}年第${item.monthInYear}月`,
        item.monthlyPayment,
        item.principalPaid,
        item.interestPaid,
        item.remainingPrincipal,
        item.cumulativePrincipal,
        item.cumulativeInterest,
        item.cumulativeTotal,
        note
      ];
    });

    // 使用 \ufeff (UTF-8 BOM) 避免在 Excel 中打开时中文字符乱码
    const csvContent = '\ufeff' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const displayMethodName = repaymentMethodName.split(' ')[0];
    const planLabel = planMode === 'adjusted' ? '提前还款新计划' : '原还款计划';
    const fileName = `${displayMethodName}_${planLabel}_每月明细单_${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打印 / 导出 PDF 
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const originalLoanAmount = originalDetails.length > 0 ? (originalDetails[0].cumulativePrincipal + originalDetails[0].remainingPrincipal) : 0;
    const finalItem = activeDetails[activeDetails.length - 1];
    
    const rowsHTML = activeDetails.map(item => {
      const prepayAtThisMonth = planMode === 'adjusted' && prepayEvents.find(e => e.monthIndex === item.monthIndex);
      const isPrepayPoint = !!prepayAtThisMonth;
      return `
        <tr style="${isPrepayPoint ? 'background-color: #fef3c7; font-weight: bold; border-top: 2px solid #f59e0b; border-bottom: 2px solid #f59e0b;' : ''}">
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: center;">${item.monthIndex}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">第 ${item.yearNumber} 年第 ${item.monthInYear} 月${isPrepayPoint ? ` [提前还贷: ¥${prepayAtThisMonth?.prepayType === 'full' ? '结清' : prepayAtThisMonth?.amountWan + '万'}]` : ''}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">¥${item.monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #059669;">¥${item.principalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #ea580c;">¥${item.interestPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #475569;">¥${item.remainingPrincipal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #059669;">¥${item.cumulativePrincipal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #ea580c;">¥${item.cumulativeInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; font-weight: bold; color: #2563eb;">¥${item.cumulativeTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>房贷计算还款明细单</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            margin: 30px;
            font-size: 10px;
            line-height: 1.35;
          }
          .header {
            text-align: center;
            margin-bottom: 16px;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 10px;
          }
          .title {
            font-size: 17px;
            font-weight: 800;
            margin: 0;
            color: #0f172a;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            margin: 4px 0 0 0;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-size: 9px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .meta-value {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-align: left;
            padding: 6px 8px;
            border-bottom: 2px solid #cbd5e1;
          }
          tr {
            page-break-inside: avoid;
          }
          @media print {
            body {
              margin: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">房贷计算还款对账明细单 (存根)</h1>
          <p class="subtitle">计算基准时间: 2026年 &middot; 导出时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">还款方式</span>
            <span class="meta-value">${repaymentMethodName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">计算计划方案</span>
            <span class="meta-value" style="color: #2563eb;">${planMode === 'adjusted' ? '提前还款调整方案' : '银行原始对照方案'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">初始贷款本金</span>
            <span class="meta-value">¥${(originalLoanAmount / 10000).toFixed(2)} 万元</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">还款总期数</span>
            <span class="meta-value">${totalMonths} 期 (${(totalMonths / 12).toFixed(1)} 年)</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最终支付利息总额</span>
            <span class="meta-value" style="color: #ea580c;">¥${finalItem ? finalItem.cumulativeInterest.toLocaleString() : '0'} 元</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">关键还贷事件</span>
            <span class="meta-value" style="color: #059669;">${planMode === 'adjusted' ? `${prepayEvents.length} 个提前还款节点` : '按期正常还款'}</span>
          </div>
        </div>

        ${planMode === 'adjusted' && prepayEvents.length > 0 ? `
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 8px; margin-bottom: 12px; font-size: 9.5px; line-height: 1.4;">
            <strong style="color: #b45309; font-size: 10.5px;">💡 提前还贷调整记录 (共 ${prepayEvents.length} 期还款)：</strong>
            <ul style="margin: 4px 0 0 14px; padding: 0; color: #78350f;">
              ${prepayEvents.map(e => `
                <li><strong>第 ${e.monthIndex} 期</strong>（第 ${e.yearNumber} 年第 ${e.monthInYear} 月）额外提前还本金 <strong>¥${e.prepayType === 'full' ? '一次性结清' : `${e.amountWan} 万元`}</strong>。调整策略：<strong>${e.strategy === 'reduce_term' ? '缩短还款期限' : '减少每月月供'}</strong>。</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 7%; text-align: center;">期数</th>
              <th style="width: 17%;">时间节点</th>
              <th style="width: 12%; text-align: right;">月供金额</th>
              <th style="width: 12%; text-align: right;">偿还本金</th>
              <th style="width: 12%; text-align: right;">偿还利息</th>
              <th style="width: 12%; text-align: right;">剩余本金</th>
              <th style="width: 12%; text-align: right;">已还本金</th>
              <th style="width: 12%; text-align: right;">已还利息</th>
              <th style="width: 14%; text-align: right;">累计总额</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  // 提取总共有多少年，用作过滤选项
  const maxYearNum = Math.ceil(originalDetails.length / 12);
  const yearsArray = Array.from({ length: maxYearNum }, (_, i) => i + 1);

  // 过滤数据
  const filteredDetails = activeDetails.filter((item) => {
    const matchesYear = filterYear === 0 || item.yearNumber === filterYear;
    const matchesSearch =
      searchQuery === '' ||
      item.monthIndex.toString() === searchQuery ||
      `第${item.monthIndex}期`.includes(searchQuery);
    return matchesYear && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      {/* 头部控制器 */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            第三步：每月还款明细单（包含本息与累计账目）
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            详细计算了贷款周期内每个月的应还本金、利息、剩余本金及历史累计还款数据。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 导出/打印按钮组 */}
          <div className="flex items-center gap-2 mr-1">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 text-xs font-bold transition-all cursor-pointer"
              title="导出当前还款方式下的完整每月明细到 CSV/Excel 文件"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>导出 Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-bold transition-all cursor-pointer"
              title="打印当前对账单或保存为 PDF 文件"
            >
              <Printer className="w-4 h-4" />
              <span>打印 / 导出 PDF</span>
            </button>
          </div>

          {/* 贷款还款方式切换 (等额本金 vs 等额本息) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            <button
              onClick={() => onRepaymentMethodChange(RepaymentMethod.EQUAL_PORTION)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeRepaymentMethod === RepaymentMethod.EQUAL_PORTION
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              等额本息 (每月固定)
            </button>
            <button
              onClick={() => onRepaymentMethodChange(RepaymentMethod.EQUAL_PRINCIPAL)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeRepaymentMethod === RepaymentMethod.EQUAL_PRINCIPAL
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              等额本金 (每月递减)
            </button>
          </div>

          {/* 原计划与新计划对比切换 */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setPlanMode('adjusted')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                planMode === 'adjusted'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              提前还款新还款明细
            </button>
            <button
              onClick={() => setPlanMode('original')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                planMode === 'original'
                  ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              银行原版明细 (不提前还贷)
            </button>
          </div>
        </div>
      </div>

      {/* 关键还款节点速查卡片 (Key Milestones) */}
      {planMode === 'adjusted' && prepayEvents.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-amber-500/[0.06] via-indigo-500/[0.04] to-emerald-500/[0.06] dark:from-amber-500/[0.1] dark:via-indigo-500/[0.08] dark:to-emerald-500/[0.1] border border-amber-500/20 dark:border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Milestone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              关键还贷节点速查（包含 {prepayEvents.length} 个提前还款节点）
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {prepayEvents.map((evt, idx) => {
              const eventMonthDetail = activeDetails.find(d => d.monthIndex === evt.monthIndex);
              const nextMonthDetail = activeDetails.find(d => d.monthIndex === evt.monthIndex + 1);

              return (
                <div
                  key={evt.id || idx}
                  className="bg-white/85 dark:bg-slate-800/80 backdrop-blur-xs border border-amber-500/20 rounded-lg p-2.5 space-y-1 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      还款节点 {idx + 1}: 第 {evt.monthIndex} 期
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (第{evt.yearNumber}年第{evt.monthInYear}月)
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500">额外还本金:</span>
                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {evt.prepayType === 'full' ? '一次性全额结清' : `¥${evt.amountWan} 万元`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500">还后剩余本金:</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                      ¥{eventMonthDetail ? (eventMonthDetail.remainingPrincipal / 10000).toFixed(2) : 0} 万元
                    </span>
                  </div>

                  {nextMonthDetail && evt.prepayType !== 'full' && (
                    <div className="flex items-baseline justify-between text-[10.5px] pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-400">下期起月供:</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ¥{nextMonthDetail.monthlyPayment.toLocaleString()} /月
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 最终结清节点 */}
            <div className="bg-white/85 dark:bg-slate-800/80 backdrop-blur-xs border border-emerald-500/20 rounded-lg p-2.5 space-y-1 text-xs shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  贷款最终结清节点
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  第 {totalMonths} 期
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                本期偿还后剩余本金归零 (¥0.00)。
              </div>

              <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-700/50 flex justify-between">
                <span>实际总还贷年限:</span>
                <span>{(totalMonths / 12).toFixed(1)} 年</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 检索与过滤条 */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        {/* 年份跳转 */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 shrink-0">年份筛选:</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-hidden"
          >
            <option value="0">全部年份 (显示整个周期)</option>
            {yearsArray.map((y) => (
              <option key={y} value={y}>
                第 {y} 年明细
              </option>
            ))}
          </select>
        </div>

        {/* 快捷按钮 */}
        <div className="sm:col-span-5 flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setFilterYear(0)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              filterYear === 0
                ? 'bg-slate-900 text-white dark:bg-slate-700'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100'
            }`}
          >
            全部
          </button>
          {maxYearNum >= 5 && (
            <button
              onClick={() => setFilterYear(5)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filterYear === 5
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100'
              }`}
            >
              第5年
            </button>
          )}
          {maxYearNum >= 10 && (
            <button
              onClick={() => setFilterYear(10)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filterYear === 10
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100'
              }`}
            >
              第10年
            </button>
          )}
          {prepayEvents.length > 0 && (
            <button
              onClick={() => setFilterYear(Math.ceil(prepayEvents[0].monthIndex / 12))}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
            >
              定位首期提前还贷年 (第{Math.ceil(prepayEvents[0].monthIndex / 12)}年)
            </button>
          )}
        </div>

        {/* 搜索 */}
        <div className="sm:col-span-3 relative">
          <input
            type="text"
            placeholder="搜具体期号，如 12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* 表格容器 */}
      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="max-h-120 overflow-y-auto relative custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 w-14 text-center">期数</th>
                <th className="py-3 px-3 w-28">时间节点</th>
                <th className="py-3 px-3 font-black text-slate-700 dark:text-slate-300">
                  月供金额 (元)
                </th>
                <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400">偿还本金 (元)</th>
                <th className="py-3 px-3 text-orange-500 dark:text-orange-400">偿还利息 (元)</th>
                <th className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">剩余本金 (元)</th>
                <th className="py-3 px-3 text-emerald-700 dark:text-emerald-300/90 font-semibold">已还本金 (元)</th>
                <th className="py-3 px-3 text-orange-700 dark:text-orange-300/90 font-semibold">已还利息 (元)</th>
                <th className="py-3 px-3 text-blue-600 dark:text-blue-400 font-bold">累计总额 (元)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredDetails.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    未检索到符合条件的月份明细，请调整年份或搜索词。
                  </td>
                </tr>
              ) : (
                filteredDetails.map((item) => {
                  const prepayAtThisMonth = planMode === 'adjusted' ? prepayEvents.find(e => e.monthIndex === item.monthIndex) : null;
                  const isPrepayPoint = !!prepayAtThisMonth;
                  const isPayoffPoint = item.monthIndex === totalMonths && item.remainingPrincipal === 0;

                  return (
                    <tr
                      key={item.monthIndex}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isPrepayPoint
                          ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12] dark:bg-amber-500/[0.1] dark:hover:bg-amber-500/[0.14] border-y-2 border-amber-500/30'
                          : isPayoffPoint
                          ? 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08]'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-400 text-center">
                        {item.monthIndex}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            第 {item.yearNumber} 年
                          </span>
                          <span className="text-[10px] text-slate-400">
                            第 {item.monthInYear} 月
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-black text-slate-800 dark:text-slate-100">
                            ¥{item.monthlyPayment.toLocaleString()}
                          </span>
                          {isPrepayPoint && prepayAtThisMonth && (
                            <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm shrink-0 shadow-xs">
                              {prepayAtThisMonth.prepayType === 'full' ? '⚡ 提前结清' : `⚡ 提前还本 ¥${prepayAtThisMonth.amountWan}万`}
                            </span>
                          )}
                          {isPayoffPoint && !isPrepayPoint && (
                            <span className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm shrink-0 shadow-xs">
                              🏁 贷款结清
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                        ¥{item.principalPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-orange-500 dark:text-orange-400">
                        ¥{item.interestPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-200">
                        ¥{item.remainingPrincipal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-700/80 dark:text-emerald-400/80">
                        ¥{item.cumulativePrincipal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-orange-700/80 dark:text-orange-400/80">
                        ¥{item.cumulativeInterest.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        ¥{item.cumulativeTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 底部统计概要 */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">当前计算方式:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-0.5">
            {repaymentMethodName}
          </span>
        </div>
        <div>
          <span className="text-slate-400">计划总还款期数:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-0.5 font-mono">
            {totalMonths} 期 ({Math.round(totalMonths / 12 * 10) / 10} 年)
          </span>
        </div>
        <div>
          <span className="text-slate-400">最终支付利息总额:</span>
          <span className="font-bold text-orange-500 block mt-0.5 font-mono">
            ¥{activeDetails.length > 0 ? activeDetails[activeDetails.length - 1].cumulativeInterest.toLocaleString() : 0} 元
          </span>
        </div>
      </div>
    </div>
  );
}
