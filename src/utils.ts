/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonthDetail, LoanResultSummary, RepaymentMethod, ComparisonSummary, PrepaymentEvent } from './types';

/**
 * 计算等额本息还款详情
 * @param amountTenThousand 贷款金额 (万元)
 * @param years 贷款年限
 * @param annualRate 年利率 (%)
 */
export function calculateEqualPortion(
  amountTenThousand: number,
  years: number,
  annualRate: number
): LoanResultSummary {
  const principal = amountTenThousand * 10000;
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  const details: MonthDetail[] = [];
  let remainingPrincipal = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  // 每月月供
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / totalMonths;
  } else {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  for (let m = 1; m <= totalMonths; m++) {
    let interestPaid = 0;
    let principalPaid = 0;

    if (monthlyRate === 0) {
      principalPaid = principal / totalMonths;
      interestPaid = 0;
    } else {
      interestPaid = remainingPrincipal * monthlyRate;
      principalPaid = monthlyPayment - interestPaid;
    }

    // 处理最后一期的尾差
    if (m === totalMonths || remainingPrincipal < principalPaid) {
      principalPaid = remainingPrincipal;
      interestPaid = remainingPrincipal * monthlyRate;
      monthlyPayment = principalPaid + interestPaid;
      remainingPrincipal = 0;
    } else {
      remainingPrincipal -= principalPaid;
    }

    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;

    details.push({
      monthIndex: m,
      yearNumber: Math.ceil(m / 12),
      monthInYear: ((m - 1) % 12) + 1,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativeTotal: Math.round((cumulativePrincipal + cumulativeInterest) * 100) / 100,
    });
  }

  const totalInterest = details.reduce((sum, item) => sum + item.interestPaid, 0);
  const totalRepayment = principal + totalInterest;

  return {
    repaymentMethod: RepaymentMethod.EQUAL_PORTION,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlyPaymentFirst: details.length > 0 ? details[0].monthlyPayment : 0,
    monthlyPaymentLast: details.length > 0 ? details[details.length - 1].monthlyPayment : 0,
    isConstantPayment: true,
    monthlyPaymentDetail: details,
  };
}

/**
 * 计算等额本金还款详情
 * @param amountTenThousand 贷款金额 (万元)
 * @param years 贷款年限
 * @param annualRate 年利率 (%)
 */
export function calculateEqualPrincipal(
  amountTenThousand: number,
  years: number,
  annualRate: number
): LoanResultSummary {
  const principal = amountTenThousand * 10000;
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  const details: MonthDetail[] = [];
  const monthlyPrincipalPaid = principal / totalMonths;
  let remainingPrincipal = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interestPaid = remainingPrincipal * monthlyRate;
    let principalPaid = monthlyPrincipalPaid;

    // 处理最后一期尾差
    if (m === totalMonths || remainingPrincipal < principalPaid) {
      principalPaid = remainingPrincipal;
    }

    const monthlyPayment = principalPaid + interestPaid;
    remainingPrincipal -= principalPaid;

    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;

    details.push({
      monthIndex: m,
      yearNumber: Math.ceil(m / 12),
      monthInYear: ((m - 1) % 12) + 1,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativeTotal: Math.round((cumulativePrincipal + cumulativeInterest) * 100) / 100,
    });
  }

  const totalInterest = details.reduce((sum, item) => sum + item.interestPaid, 0);
  const totalRepayment = principal + totalInterest;

  return {
    repaymentMethod: RepaymentMethod.EQUAL_PRINCIPAL,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlyPaymentFirst: details.length > 0 ? details[0].monthlyPayment : 0,
    monthlyPaymentLast: details.length > 0 ? details[details.length - 1].monthlyPayment : 0,
    isConstantPayment: false,
    monthlyPaymentDetail: details,
  };
}

/**
 * 获取完整对比
 */
export function getComparison(
  amountTenThousand: number,
  years: number,
  annualRate: number
): ComparisonSummary {
  const equalPortion = calculateEqualPortion(amountTenThousand, years, annualRate);
  const equalPrincipal = calculateEqualPrincipal(amountTenThousand, years, annualRate);
  const interestSavedByPrincipal = Math.max(0, equalPortion.totalInterest - equalPrincipal.totalInterest);

  return {
    equalPortion,
    equalPrincipal,
    interestSavedByPrincipal: Math.round(interestSavedByPrincipal * 100) / 100,
  };
}

export interface PrepaymentSimulationResult {
  paidMonths: number;
  paidPrincipal: number;
  paidInterest: number;
  paidTotal: number;
  remainingPrincipalBeforePrepay: number;
  prepayAmount: number; // 此次提前还款本金
  remainingPrincipalAfterPrepay: number; // 提前还款后剩余本金
  newRemainingMonths: number; // 调整后剩余期数
  newTotalInterest: number; // 新计划总利息 (已还利息 + 调整后产生的利息)
  interestSaved: number; // 节省的总利息
  newDetails: MonthDetail[]; // 新还款详情 (包含已还 + 提前还 + 调整后)
  prepayEvents?: PrepaymentEvent[];
}

/**
 * 模拟提前还款方案
 * @param originalSummary 原还款计划 summary
 * @param amountTenThousand 贷款总金额
 * @param annualRate 年利率 (%)
 * @param prepayMonthIndex 提前还款发生在第几个月末
 * @param extraPrepayPrincipal 提前偿还的本金 (元, 0代表全额结清)
 * @param strategy 提前还款后的策略: 'reduce_term' (缩短年限，月供基本不变) 或 'reduce_payment' (减少月供，年限不变)
 */
export function simulatePrepayment(
  originalSummary: LoanResultSummary,
  amountTenThousand: number,
  annualRate: number,
  prepayMonthIndex: number,
  extraPrepayPrincipal: number, // 额外还本金 (元), 如果为0代表一次性结清剩余所有本金
  strategy: 'reduce_term' | 'reduce_payment' = 'reduce_payment'
): PrepaymentSimulationResult {
  const originalDetails = originalSummary.monthlyPaymentDetail;
  const totalMonths = originalDetails.length;

  // 边界保护: 如果提前还款月份超出范围
  const actualPrepayMonth = Math.min(Math.max(1, prepayMonthIndex), totalMonths);

  // 1. 获取提前还款那一刻（即第 actualPrepayMonth 个月）的已还状态
  // 我们假设在第 actualPrepayMonth 期正常月供支付完后，立刻进行“提前还款”
  const prepayMonthDetail = originalDetails[actualPrepayMonth - 1];

  const paidMonths = actualPrepayMonth;
  const paidPrincipal = prepayMonthDetail.cumulativePrincipal;
  const paidInterest = prepayMonthDetail.cumulativeInterest;
  const paidTotal = prepayMonthDetail.cumulativeTotal;
  const remainingPrincipalBeforePrepay = prepayMonthDetail.remainingPrincipal;

  const monthlyRate = annualRate / 100 / 12;

  // 2. 提前还本金额
  // 如果 extraPrepayPrincipal 为 0，或者大于等于剩余本金，则是一次性结清
  const isFullPayoff = extraPrepayPrincipal <= 0 || extraPrepayPrincipal >= remainingPrincipalBeforePrepay;
  const prepayAmount = isFullPayoff ? remainingPrincipalBeforePrepay : extraPrepayPrincipal;
  const remainingPrincipalAfterPrepay = Math.max(0, remainingPrincipalBeforePrepay - prepayAmount);

  const newDetails: MonthDetail[] = [];

  // 把提前还款之前的期数原样复制
  for (let i = 0; i < actualPrepayMonth; i++) {
    newDetails.push({ ...originalDetails[i] });
  }

  // 3. 如果是全额结清，后续没有任何期数了
  if (isFullPayoff || remainingPrincipalAfterPrepay === 0) {
    const totalInterestPaid = paidInterest;
    const interestSaved = Math.max(0, originalSummary.totalInterest - totalInterestPaid);

    return {
      paidMonths,
      paidPrincipal,
      paidInterest,
      paidTotal,
      remainingPrincipalBeforePrepay,
      prepayAmount,
      remainingPrincipalAfterPrepay: 0,
      newRemainingMonths: 0,
      newTotalInterest: Math.round(totalInterestPaid * 100) / 100,
      interestSaved: Math.round(interestSaved * 100) / 100,
      newDetails,
    };
  }

  // 4. 部分提前还款: 模拟后半段还款
  const remainingMonthsOriginal = totalMonths - actualPrepayMonth;
  let remainingPrincipal = remainingPrincipalAfterPrepay;
  let currentCumulativePrincipal = paidPrincipal;
  let currentCumulativeInterest = paidInterest;

  let monthIdx = actualPrepayMonth + 1;

  if (originalSummary.repaymentMethod === RepaymentMethod.EQUAL_PORTION) {
    // === 等额本息的部分提前还款模拟 ===
    if (strategy === 'reduce_payment') {
      // 策略A：减少月供，期限保持不变。
      // 计算新的固定月供，基于新的剩余本金 remainingPrincipal 和剩余期数 remainingMonthsOriginal
      let newMonthlyPayment = 0;
      if (monthlyRate === 0) {
        newMonthlyPayment = remainingPrincipal / remainingMonthsOriginal;
      } else {
        newMonthlyPayment =
          (remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonthsOriginal)) /
          (Math.pow(1 + monthlyRate, remainingMonthsOriginal) - 1);
      }

      for (let m = 1; m <= remainingMonthsOriginal; m++) {
        let interestPaid = remainingPrincipal * monthlyRate;
        let principalPaid = newMonthlyPayment - interestPaid;

        if (m === remainingMonthsOriginal || remainingPrincipal < principalPaid) {
          principalPaid = remainingPrincipal;
          interestPaid = remainingPrincipal * monthlyRate;
          remainingPrincipal = 0;
        } else {
          remainingPrincipal -= principalPaid;
        }

        currentCumulativePrincipal += principalPaid;
        currentCumulativeInterest += interestPaid;

        newDetails.push({
          monthIndex: monthIdx,
          yearNumber: Math.ceil(monthIdx / 12),
          monthInYear: ((monthIdx - 1) % 12) + 1,
          monthlyPayment: Math.round((principalPaid + interestPaid) * 100) / 100,
          principalPaid: Math.round(principalPaid * 100) / 100,
          interestPaid: Math.round(interestPaid * 100) / 100,
          remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
          cumulativePrincipal: Math.round(currentCumulativePrincipal * 100) / 100,
          cumulativeInterest: Math.round(currentCumulativeInterest * 100) / 100,
          cumulativeTotal: Math.round((currentCumulativePrincipal + currentCumulativeInterest) * 100) / 100,
        });
        monthIdx++;
      }
    } else {
      // 策略B：缩短期限，月供保持基本不变。
      // 使用原有的月供金额，继续偿还新的剩余本金，看需要多少期还清。
      const originalMonthlyPayment = originalSummary.monthlyPaymentFirst;

      while (remainingPrincipal > 0.01) {
        let interestPaid = remainingPrincipal * monthlyRate;
        let principalPaid = originalMonthlyPayment - interestPaid;

        if (principalPaid <= 0) {
          // 极端情况: 如果剩余本金产生的利息大于等于月供，则每月至少还 1 元本金，避免无限循环
          principalPaid = Math.max(1, originalMonthlyPayment * 0.1);
        }

        if (remainingPrincipal < principalPaid) {
          principalPaid = remainingPrincipal;
          interestPaid = remainingPrincipal * monthlyRate;
          remainingPrincipal = 0;
        } else {
          remainingPrincipal -= principalPaid;
        }

        currentCumulativePrincipal += principalPaid;
        currentCumulativeInterest += interestPaid;

        newDetails.push({
          monthIndex: monthIdx,
          yearNumber: Math.ceil(monthIdx / 12),
          monthInYear: ((monthIdx - 1) % 12) + 1,
          monthlyPayment: Math.round((principalPaid + interestPaid) * 100) / 100,
          principalPaid: Math.round(principalPaid * 100) / 100,
          interestPaid: Math.round(interestPaid * 100) / 100,
          remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
          cumulativePrincipal: Math.round(currentCumulativePrincipal * 100) / 100,
          cumulativeInterest: Math.round(currentCumulativeInterest * 100) / 100,
          cumulativeTotal: Math.round((currentCumulativePrincipal + currentCumulativeInterest) * 100) / 100,
        });
        monthIdx++;

        // 安全保护，防止无限期计算
        if (monthIdx > 1200) break;
      }
    }
  } else {
    // === 等额本金的部分提前还款模拟 ===
    if (strategy === 'reduce_payment') {
      // 策略A：减少月供（本金），期限保持不变。
      // 剩余本金平分到剩余期数
      const newMonthlyPrincipalPaid = remainingPrincipal / remainingMonthsOriginal;

      for (let m = 1; m <= remainingMonthsOriginal; m++) {
        const interestPaid = remainingPrincipal * monthlyRate;
        let principalPaid = newMonthlyPrincipalPaid;

        if (m === remainingMonthsOriginal || remainingPrincipal < principalPaid) {
          principalPaid = remainingPrincipal;
          remainingPrincipal = 0;
        } else {
          remainingPrincipal -= principalPaid;
        }

        currentCumulativePrincipal += principalPaid;
        currentCumulativeInterest += interestPaid;

        newDetails.push({
          monthIndex: monthIdx,
          yearNumber: Math.ceil(monthIdx / 12),
          monthInYear: ((monthIdx - 1) % 12) + 1,
          monthlyPayment: Math.round((principalPaid + interestPaid) * 100) / 100,
          principalPaid: Math.round(principalPaid * 100) / 100,
          interestPaid: Math.round(interestPaid * 100) / 100,
          remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
          cumulativePrincipal: Math.round(currentCumulativePrincipal * 100) / 100,
          cumulativeInterest: Math.round(currentCumulativeInterest * 100) / 100,
          cumulativeTotal: Math.round((currentCumulativePrincipal + currentCumulativeInterest) * 100) / 100,
        });
        monthIdx++;
      }
    } else {
      // 策略B：缩短期限，月供（指本金部分）保持不变。
      // 维持原有的每月本金还款额，继续还，直到还清。
      const originalMonthlyPrincipal = amountTenThousand * 10000 / totalMonths;

      while (remainingPrincipal > 0.01) {
        const interestPaid = remainingPrincipal * monthlyRate;
        let principalPaid = originalMonthlyPrincipal;

        if (remainingPrincipal < principalPaid) {
          principalPaid = remainingPrincipal;
          remainingPrincipal = 0;
        } else {
          remainingPrincipal -= principalPaid;
        }

        currentCumulativePrincipal += principalPaid;
        currentCumulativeInterest += interestPaid;

        newDetails.push({
          monthIndex: monthIdx,
          yearNumber: Math.ceil(monthIdx / 12),
          monthInYear: ((monthIdx - 1) % 12) + 1,
          monthlyPayment: Math.round((principalPaid + interestPaid) * 100) / 100,
          principalPaid: Math.round(principalPaid * 100) / 100,
          interestPaid: Math.round(interestPaid * 100) / 100,
          remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
          cumulativePrincipal: Math.round(currentCumulativePrincipal * 100) / 100,
          cumulativeInterest: Math.round(currentCumulativeInterest * 100) / 100,
          cumulativeTotal: Math.round((currentCumulativePrincipal + currentCumulativeInterest) * 100) / 100,
        });
        monthIdx++;

        // 安全保护
        if (monthIdx > 1200) break;
      }
    }
  }

  const newTotalInterest = currentCumulativeInterest;
  const interestSaved = Math.max(0, originalSummary.totalInterest - newTotalInterest);
  const newRemainingMonths = newDetails.length - paidMonths;

  return {
    paidMonths,
    paidPrincipal,
    paidInterest,
    paidTotal,
    remainingPrincipalBeforePrepay,
    prepayAmount,
    remainingPrincipalAfterPrepay,
    newRemainingMonths,
    newTotalInterest: Math.round(newTotalInterest * 100) / 100,
    interestSaved: Math.round(interestSaved * 100) / 100,
    newDetails,
  };
}

/**
 * 模拟多次/串联提前还款方案
 */
export function simulateMultiplePrepayments(
  originalSummary: LoanResultSummary,
  amountTenThousand: number,
  annualRate: number,
  prepayEvents: PrepaymentEvent[]
): PrepaymentSimulationResult {
  const originalDetails = originalSummary.monthlyPaymentDetail;
  const totalMonths = originalDetails.length;
  const monthlyRate = annualRate / 100 / 12;
  const principal = amountTenThousand * 10000;

  // 排序保证时间先后顺序
  const sortedEvents = [...prepayEvents].sort((a, b) => a.monthIndex - b.monthIndex);

  const newDetails: MonthDetail[] = [];
  let remainingPrincipal = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  let currentMonthlyPayment = originalSummary.monthlyPaymentFirst;
  let currentMonthlyPrincipal = principal / totalMonths;

  let m = 1;
  let isFullPaidOff = false;

  const findEventForMonth = (idx: number) => sortedEvents.find(e => e.monthIndex === idx);

  while (remainingPrincipal > 0.01 && m <= 1200) {
    let interestPaid = remainingPrincipal * monthlyRate;
    let principalPaid = 0;

    if (originalSummary.repaymentMethod === RepaymentMethod.EQUAL_PORTION) {
      if (monthlyRate === 0) {
        principalPaid = remainingPrincipal / (totalMonths - m + 1);
      } else {
        principalPaid = currentMonthlyPayment - interestPaid;
        if (principalPaid <= 0 && remainingPrincipal > 0) {
          principalPaid = Math.min(remainingPrincipal, Math.max(1, currentMonthlyPayment * 0.1));
        }
      }
    } else {
      principalPaid = currentMonthlyPrincipal;
    }

    if (remainingPrincipal < principalPaid || m === 1200) {
      principalPaid = remainingPrincipal;
      remainingPrincipal = 0;
    } else {
      remainingPrincipal -= principalPaid;
    }

    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;

    // 检查当期期末是否有提前还款事件
    const prepayEvent = findEventForMonth(m);
    let extraPrepayAmount = 0;

    if (prepayEvent && remainingPrincipal > 0.01) {
      if (prepayEvent.prepayType === 'full' || prepayEvent.amountWan * 10000 >= remainingPrincipal) {
        // 全额结清
        extraPrepayAmount = remainingPrincipal;
        remainingPrincipal = 0;
        cumulativePrincipal += extraPrepayAmount;
        isFullPaidOff = true;
      } else {
        // 部分还款
        extraPrepayAmount = prepayEvent.amountWan * 10000;
        remainingPrincipal -= extraPrepayAmount;
        cumulativePrincipal += extraPrepayAmount;

        const remainingMonthsScheduled = totalMonths - m;
        if (remainingMonthsScheduled > 0) {
          if (originalSummary.repaymentMethod === RepaymentMethod.EQUAL_PORTION) {
            if (prepayEvent.strategy === 'reduce_payment') {
              if (monthlyRate === 0) {
                currentMonthlyPayment = remainingPrincipal / remainingMonthsScheduled;
              } else {
                currentMonthlyPayment =
                  (remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonthsScheduled)) /
                  (Math.pow(1 + monthlyRate, remainingMonthsScheduled) - 1);
              }
            }
          } else {
            if (prepayEvent.strategy === 'reduce_payment') {
              currentMonthlyPrincipal = remainingPrincipal / remainingMonthsScheduled;
            }
          }
        }
      }
    }

    newDetails.push({
      monthIndex: m,
      yearNumber: Math.ceil(m / 12),
      monthInYear: ((m - 1) % 12) + 1,
      monthlyPayment: Math.round((principalPaid + interestPaid + extraPrepayAmount) * 100) / 100,
      principalPaid: Math.round((principalPaid + extraPrepayAmount) * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativeTotal: Math.round((cumulativePrincipal + cumulativeInterest) * 100) / 100,
    });

    if (isFullPaidOff) {
      break;
    }

    m++;
  }

  // 计算第一笔提前还款前的期数作为支付对照期
  const firstPrepayEvent = sortedEvents[0];
  const paidMonths = firstPrepayEvent ? Math.min(firstPrepayEvent.monthIndex, newDetails.length) : totalMonths;

  const prepayMonthDetail = newDetails[paidMonths - 1] || {
    cumulativePrincipal: 0,
    cumulativeInterest: 0,
    cumulativeTotal: 0,
    remainingPrincipal: 0
  };

  const totalPrepayAmount = sortedEvents.reduce((sum, e) => {
    return sum + (e.prepayType === 'full' ? 0 : e.amountWan * 10000);
  }, 0);

  const newTotalInterest = cumulativeInterest;
  const interestSaved = Math.max(0, originalSummary.totalInterest - newTotalInterest);
  const newRemainingMonths = Math.max(0, newDetails.length - paidMonths);

  return {
    paidMonths,
    paidPrincipal: prepayMonthDetail.cumulativePrincipal,
    paidInterest: prepayMonthDetail.cumulativeInterest,
    paidTotal: prepayMonthDetail.cumulativeTotal,
    remainingPrincipalBeforePrepay: prepayMonthDetail.remainingPrincipal + (firstPrepayEvent && firstPrepayEvent.prepayType !== 'full' ? firstPrepayEvent.amountWan * 10000 : 0),
    prepayAmount: totalPrepayAmount,
    remainingPrincipalAfterPrepay: remainingPrincipal,
    newRemainingMonths,
    newTotalInterest: Math.round(newTotalInterest * 100) / 100,
    interestSaved: Math.round(interestSaved * 100) / 100,
    newDetails,
    prepayEvents: sortedEvents,
  };
}

/**
 * 计算多期提前还款中，每一个事件执行前（当期正常月供扣减后、本次提前还款扣减前）的真实剩余待还本金
 */
export function getRemainingPrincipalBeforePrepayEvents(
  originalSummary: LoanResultSummary,
  amountTenThousand: number,
  annualRate: number,
  prepayEvents: PrepaymentEvent[]
): Map<string, number> {
  const result = new Map<string, number>();

  // 按照时间先后顺序排序
  const sortedEvents = [...prepayEvents].sort((a, b) => a.monthIndex - b.monthIndex);

  for (let i = 0; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    // 取得在当前事件之前发生的所有还款事件
    const priorEvents = sortedEvents.slice(0, i);

    // 运行只包含前序还款事件的模拟计算
    const sim = simulateMultiplePrepayments(
      originalSummary,
      amountTenThousand,
      annualRate,
      priorEvents
    );

    // 获取当前事件目标月份在模拟后的月供详情
    if (currentEvent.monthIndex > sim.newDetails.length) {
      // 说明在当前事件发生前，贷款已被提前结清或期数已结束
      result.set(currentEvent.id, 0);
    } else {
      const detail = sim.newDetails[currentEvent.monthIndex - 1];
      result.set(currentEvent.id, detail ? detail.remainingPrincipal : 0);
    }
  }

  return result;
}

