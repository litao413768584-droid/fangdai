/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MonthDetail, RepaymentMethod, PrepaymentEvent } from '../types';
import { Search, Filter, ArrowDown, Sparkles, FileSpreadsheet, Printer } from 'lucide-react';

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
    const headers = ['期数', '时间节点', '月供金额(元)', '偿还本金(元)', '偿还利息(元)', '剩余本金(元)', '累计还款总额(元)'];
    const rows = activeDetails.map(item => [
      item.monthIndex,
      `第${item.yearNumber}年第${item.monthInYear}月`,
      item.monthlyPayment,
      item.principalPaid,
      item.interestPaid,
      item.remainingPrincipal,
      item.cumulativeTotal
    ]);

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
    // 创建隐藏的 iframe 用于托管高品质打印视口
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
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">第 ${item.yearNumber} 年第 ${item.monthInYear} 月${isPrepayPoint ? ' [提前还贷点]' : ''}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">¥${item.monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #059669;">¥${item.principalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #ea580c;">¥${item.interestPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">¥${item.remainingPrincipal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; color: #475569;">¥${item.cumulativeTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
            margin: 40px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 12px;
          }
          .title {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            color: #0f172a;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            margin: 5px 0 0 0;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
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
            font-size: 12px;
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
            padding: 8px;
            border-bottom: 2px solid #cbd5e1;
          }
          tr {
            page-break-inside: avoid;
          }
          @media print {
            body {
              margin: 15px;
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
            <span class="meta-label">最终累计偿还总额 (本+息)</span>
            <span class="meta-value" style="color: #0f172a;">¥${finalItem ? finalItem.cumulativeTotal.toLocaleString() : '0'} 元</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最终支付净利息总额</span>
            <span class="meta-value" style="color: #ea580c;">¥${finalItem ? finalItem.cumulativeInterest.toLocaleString() : '0'} 元</span>
          </div>
        </div>

        ${planMode === 'adjusted' && prepayEvents.length > 0 ? `
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 10px; margin-bottom: 15px; font-size: 10px; line-height: 1.5;">
            <strong style="color: #b45309; font-size: 11px;">💡 提前还贷调整记录 (共 ${prepayEvents.length} 期还款)：</strong>
            <ul style="margin: 5px 0 0 14px; padding: 0; color: #78350f;">
              ${prepayEvents.map(e => `
                <li><strong>第 ${e.monthIndex} 期</strong>（第 ${e.yearNumber} 年第 ${e.monthInYear} 月）已正常月供扣款后，额外提前还本金 <strong>¥${e.prepayType === 'full' ? '一次性结清' : `${e.amountWan} 万元`}</strong>。还款后调整策略：<strong>${e.strategy === 'reduce_term' ? '缩短还款期限' : '减少每月月供'}</strong>。</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">期数</th>
              <th style="width: 18%;">时间节点</th>
              <th style="width: 15%; text-align: right;">月供金额</th>
              <th style="width: 15%; text-align: right;">偿还本金</th>
              <th style="width: 15%; text-align: right;">偿还利息</th>
              <th style="width: 15%; text-align: right;">剩余本金</th>
              <th style="width: 15%; text-align: right;">累计已还</th>
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
            第三步：每月还款明细单（包含本息细分）
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            详细计算了贷款周期内每个月的应还本金、利息与剩余本金。支持快速筛选和方案对比。
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
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                planMode === 'adjusted'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              提前还款新还款明细
            </button>
            <button
              onClick={() => setPlanMode('original')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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

      {/* 提前还贷事件高亮说明条 */}
      {planMode === 'adjusted' && prepayEvents.length > 0 && (
        <div className="mb-4 bg-amber-500/[0.04] dark:bg-amber-500/[0.08] border border-amber-500/15 p-3 rounded-xl flex items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping shrink-0"></span>
            <span className="text-slate-700 dark:text-slate-300">
              提示：下方明细中高亮行（当前试算计划包含 <strong className="text-amber-600 font-bold">{prepayEvents.length} 个</strong> 提前还款点）代表提前还本期。在该期正常扣款完毕后，即进行额外还贷。
            </span>
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
            当前处于试算预览
          </span>
        </div>
      )}

      {/* 表格容器 */}
      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="max-h-120 overflow-y-auto relative custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16">期数</th>
                <th className="py-3 px-4 w-28">时间节点</th>
                <th className="py-3 px-4 font-black text-slate-700 dark:text-slate-300">
                  月供金额 (元)
                </th>
                <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">偿还本金 (元)</th>
                <th className="py-3 px-4 text-orange-500 dark:text-orange-400">偿还利息 (元)</th>
                <th className="py-3 px-4">剩余本金 (元)</th>
                <th className="py-3 px-4 text-slate-400 font-normal">累计还款 (元)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredDetails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    未检索到符合条件的月份明细，请调整年份或搜索词。
                  </td>
                </tr>
              ) : (
                filteredDetails.map((item) => {
                  const prepayAtThisMonth = planMode === 'adjusted' && prepayEvents.find(e => e.monthIndex === item.monthIndex);
                  const isPrepayPoint = !!prepayAtThisMonth;

                  return (
                    <tr
                      key={item.monthIndex}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isPrepayPoint
                          ? 'bg-amber-500/[0.07] hover:bg-amber-500/[0.1] dark:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.12] border-y-2 border-amber-500/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {item.monthIndex}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-200">
                            第 {item.yearNumber} 年
                          </span>
                          <span className="text-[10px] text-slate-400">
                            第 {item.monthInYear} 月
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-800 dark:text-slate-100">
                            ¥{item.monthlyPayment.toLocaleString()}
                          </span>
                          {isPrepayPoint && prepayAtThisMonth && (
                            <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm shrink-0 shadow-xs">
                              提前还 {prepayAtThisMonth.prepayType === 'full' ? '一次结清' : `${prepayAtThisMonth.amountWan}万`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                        ¥{item.principalPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-orange-500 dark:text-orange-400">
                        ¥{item.interestPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        ¥{item.remainingPrincipal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
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
          <span className="text-slate-400">明细表中展示的总期数:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-0.5 font-mono">
            {totalMonths} 期 ({Math.round(totalMonths / 12 * 10) / 10} 年)
          </span>
        </div>
        <div>
          <span className="text-slate-400">明细最终总利息支出:</span>
          <span className="font-bold text-orange-500 block mt-0.5 font-mono">
            ¥{activeDetails.length > 0 ? activeDetails[activeDetails.length - 1].cumulativeInterest.toLocaleString() : 0} 元
          </span>
        </div>
      </div>
    </div>
  );
}
