/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ComparisonSummary, LoanInput } from '../types';
import { Sparkles, ArrowRight, Wallet, TrendingDown, HelpCircle, Share2, Camera, Download, X, Loader2 } from 'lucide-react';

interface ComparisonCardsProps {
  comparison: ComparisonSummary;
  loanInput: LoanInput;
}

export function ComparisonCards({ comparison, loanInput }: ComparisonCardsProps) {
  const { equalPortion, equalPrincipal, interestSavedByPrincipal } = comparison;
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 辅助转化：元 -> 万元
  const formatToWan = (yuan: number) => {
    return (yuan / 10000).toFixed(2);
  };

  // 画圆角矩形辅助
  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // 绘制自动换行的中文/英文字符
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  // 生成分享图片
  const handleGenerateImage = () => {
    setIsGenerating(true);

    // 稍微延迟，以便加载状态在 UI 渲染出来
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1450;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('您的浏览器不支持 canvas，无法生成图片。');
          setIsGenerating(false);
          return;
        }

        // 1. 背景渐变 (深色优雅科技感)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1450);
        bgGrad.addColorStop(0, '#0a0d1e');
        bgGrad.addColorStop(0.5, '#0f1428');
        bgGrad.addColorStop(1, '#151b34');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1450);

        // 2. 科技网格背景
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1200; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 1450);
          ctx.stroke();
        }
        for (let j = 0; j < 1450; j += 60) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(1200, j);
          ctx.stroke();
        }

        // 3. 霓虹光晕装饰
        const glowTop = ctx.createRadialGradient(1000, 200, 0, 1000, 200, 400);
        glowTop.addColorStop(0, 'rgba(99, 102, 241, 0.15)'); // Indigo glow
        glowTop.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowTop;
        ctx.fillRect(0, 0, 1200, 1450);

        const glowBottom = ctx.createRadialGradient(200, 1200, 0, 200, 1200, 500);
        glowBottom.addColorStop(0, 'rgba(16, 185, 129, 0.12)'); // Emerald glow
        glowBottom.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowBottom;
        ctx.fillRect(0, 0, 1200, 1450);

        // 4. 页眉品牌文字与标签
        ctx.fillStyle = '#6366F1';
        ctx.font = 'bold 13px "JetBrains Mono", Courier, monospace';
        ctx.fillText('MORTGAGE COMPARISON & SAVINGS REPORT', 70, 95);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 42px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('房贷还款方案对比分析报告', 70, 152);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('专业级商业贷款对账工具 · 助您深度比对利息耗散、避开银行复利陷阱', 70, 192);

        // 页眉分割线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(70, 220);
        ctx.lineTo(1130, 220);
        ctx.stroke();

        // 5. 初始参数汇总卡片
        drawRoundRect(ctx, 70, 252, 1060, 142, 18);
        ctx.fillStyle = '#11182c';
        ctx.fill();
        ctx.strokeStyle = '#1d2745';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const colWidth = 1060 / 3;

        // 贷款本金
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.fillText('① 初始贷款本金', 70 + 40, 298);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px "JetBrains Mono", sans-serif';
        const amtStr = loanInput.loanAmount.toFixed(2);
        ctx.fillText(`¥${amtStr}`, 70 + 40, 350);
        const amtW = ctx.measureText(`¥${amtStr}`).width;
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "PingFang SC", sans-serif';
        ctx.fillText(' 万元', 70 + 40 + amtW + 5, 350);

        // 贷款年限
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.fillText('② 贷款还款期限', 70 + colWidth + 40, 298);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px "JetBrains Mono", sans-serif';
        const termStr = `${loanInput.loanTermYears}`;
        ctx.fillText(termStr, 70 + colWidth + 40, 350);
        const termW = ctx.measureText(termStr).width;
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "PingFang SC", sans-serif';
        ctx.fillText(` 年 (${loanInput.loanTermYears * 12}期)`, 70 + colWidth + 40 + termW + 5, 350);

        // 基准利率
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.fillText('③ 商贷基准年利率', 70 + colWidth * 2 + 40, 298);
        ctx.fillStyle = '#F59E0B'; // 琥珀金
        ctx.font = 'bold 34px "JetBrains Mono", sans-serif';
        const rateStr = loanInput.annualRate.toFixed(2);
        ctx.fillText(rateStr, 70 + colWidth * 2 + 40, 350);
        const rateW = ctx.measureText(rateStr).width;
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "PingFang SC", sans-serif';
        ctx.fillText(' % (LPR基准)', 70 + colWidth * 2 + 40 + rateW + 5, 350);

        // 6. 双向对比卡片
        const x1 = 70;
        const yStart = 432;
        const cardW = 510;
        const cardH = 435;

        // 等额本息 (左卡片)
        drawRoundRect(ctx, x1, yStart, cardW, cardH, 20);
        ctx.fillStyle = '#11182c';
        ctx.fill();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)';
        ctx.stroke();

        // 顶部高亮彩条 (等额本息)
        drawRoundRect(ctx, x1, yStart, cardW, 10, 20);
        ctx.fillStyle = '#3B82F6';
        ctx.fill();
        ctx.fillRect(x1, yStart + 5, cardW, 5); // 覆盖下半角

        ctx.fillStyle = '#93C5FD';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('EQUAL PRINCIPAL & INTEREST', x1 + 35, yStart + 48);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px "PingFang SC", sans-serif';
        ctx.fillText('等额本息还款法', x1 + 35, yStart + 85);

        ctx.fillStyle = '#64748B';
        ctx.font = '500 13px "PingFang SC", sans-serif';
        ctx.fillText('每月还款恒定 · 前期利息占比高达70%', x1 + 35, yStart + 115);

        // 本息合计
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.fillText('总还款额 (本金 + 利息累计)', x1 + 35, yStart + 165);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px "JetBrains Mono", sans-serif';
        const rep1 = (equalPortion.totalRepayment / 10000).toFixed(2);
        ctx.fillText(`¥${rep1} 万`, x1 + 35, yStart + 205);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 12px "JetBrains Mono", sans-serif';
        ctx.fillText(`( 实际还款总额：${Math.round(equalPortion.totalRepayment).toLocaleString()} 元 )`, x1 + 35, yStart + 232);

        // 利息总额
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.fillText('支付利息总额 (累计纯利息支出)', x1 + 35, yStart + 282);
        ctx.fillStyle = '#EF4444'; // 红色表示利息较重
        ctx.font = 'bold 30px "JetBrains Mono", sans-serif';
        const int1 = (equalPortion.totalInterest / 10000).toFixed(2);
        ctx.fillText(`¥${int1} 万`, x1 + 35, yStart + 322);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 12px "JetBrains Mono", sans-serif';
        ctx.fillText(`( 纯利息总支出：${Math.round(equalPortion.totalInterest).toLocaleString()} 元 )`, x1 + 35, yStart + 349);

        // 固定月供
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.fillText('每月固定月供额：', x1 + 35, yStart + 400);
        ctx.fillStyle = '#60A5FA';
        ctx.font = 'bold 17px "JetBrains Mono", sans-serif';
        ctx.fillText(`¥${Math.round(equalPortion.monthlyPaymentFirst).toLocaleString()} 元/月`, x1 + 155, yStart + 400);


        // 等额本金 (右卡片)
        const x2 = 620;
        drawRoundRect(ctx, x2, yStart, cardW, cardH, 20);
        ctx.fillStyle = '#11182c';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.stroke();

        // 顶部高亮彩条 (等额本金)
        drawRoundRect(ctx, x2, yStart, cardW, 10, 20);
        ctx.fillStyle = '#10B981';
        ctx.fill();
        ctx.fillRect(x2, yStart + 5, cardW, 5); // 覆盖下半角

        ctx.fillStyle = '#A7F3D0';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('EQUAL PRINCIPAL PAYMENT', x2 + 35, yStart + 48);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px "PingFang SC", sans-serif';
        ctx.fillText('等额本金还款法', x2 + 35, yStart + 85);

        ctx.fillStyle = '#64748B';
        ctx.font = '500 13px "PingFang SC", sans-serif';
        ctx.fillText('每月本金均分 · 月供额随剩余本金逐月递减', x2 + 35, yStart + 115);

        // 本息合计
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.fillText('总还款额 (本金 + 利息累计)', x2 + 35, yStart + 165);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px "JetBrains Mono", sans-serif';
        const rep2 = (equalPrincipal.totalRepayment / 10000).toFixed(2);
        ctx.fillText(`¥${rep2} 万`, x2 + 35, yStart + 205);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 12px "JetBrains Mono", sans-serif';
        ctx.fillText(`( 实际还款总额：${Math.round(equalPrincipal.totalRepayment).toLocaleString()} 元 )`, x2 + 35, yStart + 232);

        // 利息总额
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.fillText('支付利息总额 (比左侧大额度节省)', x2 + 35, yStart + 282);
        ctx.fillStyle = '#10B981'; // 翠绿代表省钱
        ctx.font = 'bold 30px "JetBrains Mono", sans-serif';
        const int2 = (equalPrincipal.totalInterest / 10000).toFixed(2);
        ctx.fillText(`¥${int2} 万`, x2 + 35, yStart + 322);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 12px "JetBrains Mono", sans-serif';
        ctx.fillText(`( 纯利息总支出：${Math.round(equalPrincipal.totalInterest).toLocaleString()} 元 )`, x2 + 35, yStart + 349);

        // 动态月供
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.fillText('月供变化区间：', x2 + 35, yStart + 400);
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
        ctx.fillText(`¥${Math.round(equalPrincipal.monthlyPaymentFirst).toLocaleString()} → ¥${Math.round(equalPrincipal.monthlyPaymentLast).toLocaleString()} 元/月`, x2 + 130, yStart + 400);


        // 7. 省钱王超级横幅 (Emerald - Blue - Violet Gradient)
        const sbX = 70;
        const sbY = 896;
        const sbW = 1060;
        const sbH = 195;

        drawRoundRect(ctx, sbX, sbY, sbW, sbH, 22);
        const gradCard = ctx.createLinearGradient(sbX, sbY, sbX + sbW, sbY);
        gradCard.addColorStop(0, '#1d4ed8'); // blue-700
        gradCard.addColorStop(0.4, '#4f46e5'); // indigo-600
        gradCard.addColorStop(1, '#047857'); // emerald-700
        ctx.fillStyle = gradCard;
        ctx.fill();

        // 黄金边框，突出权威对比
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 13px "PingFang SC", sans-serif';
        ctx.fillText('★ 利息对比核心理财结论 ★', sbX + 45, sbY + 42);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 23px "PingFang SC", sans-serif';
        ctx.fillText('选择 “等额本金” 比 “等额本息” 累计可净省利息：', sbX + 45, sbY + 82);

        ctx.fillStyle = '#FBBF24'; // 璀璨黄金色
        ctx.font = 'bold 44px "JetBrains Mono", sans-serif';
        const savedValStr = `¥${Math.round(interestSavedByPrincipal).toLocaleString()}`;
        ctx.fillText(savedValStr, sbX + 45, sbY + 142);

        const savedValW = ctx.measureText(savedValStr).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 15px "PingFang SC", sans-serif';
        ctx.fillText(` 元  ( 折合人民币约：${formatToWan(interestSavedByPrincipal)} 万元 )`, sbX + 45 + savedValW, sbY + 136);


        // 8. 理财决策金律
        const advX = 70;
        const advY = 1118;
        const advW = 1060;
        const advH = 185;

        drawRoundRect(ctx, advX, advY, advW, advH, 16);
        ctx.fillStyle = '#11182c';
        ctx.fill();
        ctx.strokeStyle = '#1d2745';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#F59E0B'; // 琥珀橙
        ctx.font = 'bold 15px "PingFang SC", sans-serif';
        ctx.fillText('💡 房贷理财决策金律：', advX + 35, advY + 36);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 13.5px "PingFang SC", sans-serif';

        const bullet1 = '1. 理财溢价原则：若手头闲置资金的理财年化收益率，无法稳健跑赢您的房贷利率（如LPR 3.5%），在还满整个还款周期的前提下，建议优先选择【等额本金】。这相当于为您的资产做了年化 3.5% 的无风险增值。';
        const bullet2 = '2. 提前还本时机：等额本息大部分利息在还款前三分之一期被扣除（复利效应）。如果您计划在中途（如第3-5年）提前部分还贷，提前还款越早利息越省，通过本金均分可迅速降低剩余借款基数。';

        drawWrappedText(ctx, bullet1, advX + 35, advY + 68, advW - 70, 22);
        drawWrappedText(ctx, bullet2, advX + 35, advY + 120, advW - 70, 22);


        // 9. 页脚声明与水印
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(70, 1332);
        ctx.lineTo(1130, 1332);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = '500 13px "PingFang SC", sans-serif';
        ctx.fillText('房贷计算与提前还款对比工具 · 智能对账单存根', 70, 1370);

        const localTimeStr = `测算时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}  ·  用户留档副本`;
        ctx.font = '500 13px "JetBrains Mono", sans-serif';
        const timeW = ctx.measureText(localTimeStr).width;
        ctx.fillText(localTimeStr, 1130 - timeW, 1370);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const secTag = 'SECURE & ENCRYPTED FINANCIAL CALCULATION SHEET';
        const secW = ctx.measureText(secTag).width;
        ctx.fillText(secTag, 600 - secW / 2, 1412);

        // 导出 PNG URL
        const dataUrl = canvas.toDataURL('image/png');
        setShareImageUrl(dataUrl);
      } catch (err) {
        console.error(err);
        alert('生成分享图片时发生未知错误。');
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  // 触发文件下载
  const handleDownload = () => {
    if (!shareImageUrl) return;
    const link = document.createElement('a');
    link.href = shareImageUrl;
    link.download = `房贷对比分析图_${loanInput.loanAmount}万_${loanInput.loanTermYears}年.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* 标题说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            还款方案深度对比
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            等额本息：每月月供固定，适合收入平稳、前期预算紧张的家庭。等额本金：每月月供递减，利息最省，但前期还款压力大。
          </p>
        </div>
        <button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-75 disabled:cursor-wait text-white text-xs font-bold shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/30 transition-all cursor-pointer select-none"
          title="生成当前方案的高清长图用于保存或社交网络分享"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在生成对比图...</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>生成对比分享图</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: 等额本息 */}
        <div className="relative bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 shadow-xs overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 transition-all">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                等额本息 (每月还款额固定)
              </span>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
                等额本息还款法
              </h4>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-500">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-5 py-4 border-y border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                总还款额 (本息合计)
              </span>
              <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">
                ¥{formatToWan(equalPortion.totalRepayment)}
                <span className="text-xs font-normal text-slate-500 ml-0.5">万</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {equalPortion.totalRepayment.toLocaleString()} 元
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                利息总额 (净利息)
              </span>
              <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400">
                ¥{formatToWan(equalPortion.totalInterest)}
                <span className="text-xs font-normal text-orange-500 ml-0.5">万</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {equalPortion.totalInterest.toLocaleString()} 元
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <span>每月固定月供额:</span>
              <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                ¥{Math.round(equalPortion.monthlyPaymentFirst).toLocaleString()} / 月
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">
                方案特性与理财建议:
              </span>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-500 leading-relaxed">
                <li>每月还款固定，便于家庭资金流调配和做财务计划。</li>
                <li>前期还款的大部分是利息，本金还得很慢。</li>
                <li>适合人群：工作年限不长、目前月收入稳定、处于创业期或积蓄不多的年轻人。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Card 2: 等额本金 */}
        <div className="relative bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 shadow-xs overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                等额本金 (每月还款额递减)
              </span>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
                等额本金还款法
              </h4>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-500">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-5 py-4 border-y border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                总还款额 (本息合计)
              </span>
              <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">
                ¥{formatToWan(equalPrincipal.totalRepayment)}
                <span className="text-xs font-normal text-slate-500 ml-0.5">万</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {equalPrincipal.totalRepayment.toLocaleString()} 元
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                利息总额 (比左侧更省)
              </span>
              <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                ¥{formatToWan(equalPrincipal.totalInterest)}
                <span className="text-xs font-normal text-emerald-500 ml-0.5">万</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {equalPrincipal.totalInterest.toLocaleString()} 元
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg gap-2">
              <span>月供递减区间:</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
                首月 ¥{Math.round(equalPrincipal.monthlyPaymentFirst).toLocaleString()} → 末月 ¥{Math.round(equalPrincipal.monthlyPaymentLast).toLocaleString()}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">
                方案特性与理财建议:
              </span>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-500 leading-relaxed">
                <li>每月平分本金，利息随剩余本金减少而快速递减。</li>
                <li>利息支出最省，越还越轻松，后期压力极小。</li>
                <li>适合人群：当前积蓄丰厚、收入较高或处于高收入行业，且有计划在后期提前还款的人群。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>



      {/* 炫酷的图片分享弹窗 */}
      {shareImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setShareImageUrl(null)}
        >
          <div 
            className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 max-w-lg w-full shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // 阻止冒泡
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShareImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-500/10">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">✨ 房贷对比分享图生成完毕 ✨</h4>
              <p className="text-xs text-slate-400 mt-1">
                点击下方按钮保存超清大图，或在下方预览上直接长按/右键另存。
              </p>
            </div>

            {/* 预览区域 */}
            <div className="w-full flex-1 min-h-0 bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-y-auto custom-scrollbar group relative">
              <img
                src={shareImageUrl}
                alt="房贷方案对比总结图"
                className="w-full h-auto rounded-xl shadow-md pointer-events-auto select-all select-none border border-white/5 transition-transform group-hover:scale-[1.01]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* 控制区 */}
            <div className="w-full flex flex-col sm:flex-row gap-3 mt-5">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>下载超清分享大图</span>
              </button>
              <button
                onClick={() => setShareImageUrl(null)}
                className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
