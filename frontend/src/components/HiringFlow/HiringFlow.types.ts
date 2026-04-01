export type ScheduleType = 'lump_sum' | 'installments' | 'recurring';
export type TriggerType = 'next_payroll_run' | 'months_after_start';
export type RecurringFrequency = 'monthly' | 'quarterly' | 'annually';

export interface Tranche {
  id: string;
  amountPercent: number;
  trigger: TriggerType;
  monthsAfterStart?: number;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  employeeName: string;
  employeeDepartment: string;
  employeeRole: string;
  employeeStartDate: string;
  hasUpFrontPayments: boolean | null;
  calculationAmount: number;
  scheduleType: ScheduleType;
  tranches: Tranche[];
  recurringFrequency: RecurringFrequency;
  recurringDurationYears: number;
}

export const COMPENSATION_DEFAULTS = {
  annualSalary: 185000,
  equityOptions: 10000,
  equityVestYears: 4,
  equityCliffYears: 1,
  targetBonusPercent: 15,
};

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  next_payroll_run: 'Next payroll run',
  months_after_start: 'Months after start date',
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  annually: 'annually',
};

export function createTranche(overrides?: Partial<Tranche>): Tranche {
  return {
    id: crypto.randomUUID(),
    amountPercent: 50,
    trigger: 'next_payroll_run',
    ...overrides,
  };
}

export function getFrequencyPaymentsPerYear(freq: RecurringFrequency): number {
  switch (freq) {
    case 'monthly': return 12;
    case 'quarterly': return 4;
    case 'annually': return 1;
  }
}

export function generateRecurringTranches(
  frequency: RecurringFrequency,
  durationYears: number,
): Tranche[] {
  const paymentsPerYear = getFrequencyPaymentsPerYear(frequency);
  const totalPayments = paymentsPerYear * durationYears;
  if (totalPayments <= 0) return [];

  const percentEach = Math.round((100 / totalPayments) * 100) / 100;
  const monthsBetween = 12 / paymentsPerYear;

  return Array.from({ length: totalPayments }, (_, i) => ({
    id: crypto.randomUUID(),
    amountPercent: i === totalPayments - 1
      ? Math.round((100 - percentEach * (totalPayments - 1)) * 100) / 100
      : percentEach,
    trigger: 'months_after_start' as TriggerType,
    monthsAfterStart: Math.round(monthsBetween * (i + 1)),
  }));
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  step: 1,
  employeeName: '',
  employeeDepartment: '',
  employeeRole: '',
  employeeStartDate: '',
  hasUpFrontPayments: null,
  calculationAmount: 20000,
  scheduleType: 'lump_sum',
  tranches: [createTranche({ amountPercent: 50 }), createTranche({ amountPercent: 50 })],
  recurringFrequency: 'quarterly',
  recurringDurationYears: 1,
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
