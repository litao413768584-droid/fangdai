/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RepaymentMethod {
  EQUAL_PORTION = 'equal_portion', // 等额本息 (Equal Principal and Interest)
  EQUAL_PRINCIPAL = 'equal_principal' // 等额本金 (Equal Principal)
}

export interface LoanInput {
  loanAmount: number;         // 贷款金额 (万元)
  loanTermYears: number;      // 贷款年限 (年)
  annualRate: number;         // 年利率 (%)
  prepaymentYear: number;     // 提前还款年限 (第几年)
  prepaymentMonth: number;    // 提前还款月份 (第几个月)
}

export interface MonthDetail {
  monthIndex: number;         // 期数 (第几个月)
  yearNumber: number;         // 年数 (第几年)
  monthInYear: number;        // 年内月数 (1-12)
  monthlyPayment: number;     // 月供金额 (元)
  principalPaid: number;      // 偿还本金 (元)
  interestPaid: number;       // 偿还利息 (元)
  remainingPrincipal: number; // 剩余本金 (元)
  cumulativePrincipal: number;// 累计已还本金 (元)
  cumulativeInterest: number; // 累计已还利息 (元)
  cumulativeTotal: number;    // 累计已还总额 (元)
}

export interface PrepaymentResult {
  paidMonths: number;         // 已还月数
  paidYears: number;          // 已还年数
  paidPrincipal: number;      // 已还本金 (元)
  paidInterest: number;       // 已还利息 (元)
  paidTotal: number;          // 已还本息总额 (元)
  remainingPrincipal: number; // 剩余本金 (元)
  originalTotalInterest: number; // 原计划总利息 (元)
  originalTotalRepayment: number;// 原计划总还款额 (元)
}

export interface LoanResultSummary {
  repaymentMethod: RepaymentMethod;
  totalRepayment: number;     // 总还款额 (元)
  totalInterest: number;      // 总利息额 (元)
  monthlyPaymentFirst: number;// 首月月供 (元)
  monthlyPaymentLast: number; // 末月月供 (元) (等额本金有差异)
  isConstantPayment: boolean; // 是否是固定月供
  monthlyPaymentDetail: MonthDetail[];
}

export interface ComparisonSummary {
  equalPortion: LoanResultSummary;
  equalPrincipal: LoanResultSummary;
  interestSavedByPrincipal: number; // 等额本金相比等额本息省下的利息
}

export interface PrepaymentEvent {
  id: string;
  monthIndex: number;          // 发生在第几个期数点
  yearNumber: number;          // 对应第几年
  monthInYear: number;         // 对应当年第几个月
  amountWan: number;           // 提前还本金 (万元)
  prepayType: 'partial' | 'full'; // 'partial' 部分提前还款, 'full' 一次性全额结清
  strategy: 'reduce_term' | 'reduce_payment'; // 还本后的策略
}

