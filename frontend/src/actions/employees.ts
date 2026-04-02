import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Employee, EmployeePayouts, PayoutItem } from '../types';

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const fetchEmployees = () =>
  http<Employee[]>('/employees');

export const fetchEmployee = (employeeId: string) =>
  http<Employee>(`/employees/${employeeId}`);

export const fetchEmployeePayouts = (employeeId: string) =>
  http<EmployeePayouts>(`/employees/${employeeId}/payouts`);

export interface CreatePayoutData {
  employee_id: string;
  group_id: string;
  amount: number;
  date: string;
}

export const createPayout = (data: CreatePayoutData) =>
  http<PayoutItem>('/payouts', { method: 'POST', body: JSON.stringify(data) });

export const useEmployees = () =>
  useQuery({ queryKey: ['employees'], queryFn: fetchEmployees });

export const useEmployee = (employeeId: string) =>
  useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => fetchEmployee(employeeId),
    enabled: !!employeeId,
  });

export const useEmployeePayouts = (employeeId: string) =>
  useQuery({
    queryKey: ['employee-payouts', employeeId],
    queryFn: () => fetchEmployeePayouts(employeeId),
    enabled: !!employeeId,
  });

export const useCreatePayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayout,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['employee-payouts', variables.employee_id] });
    },
  });
};

export interface CreateEmployeeData {
  name: string;
  department: string;
  role: string;
  country?: string;
  start_date: string;
}

export const createEmployee = (data: CreateEmployeeData) =>
  http<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export interface TrancheInput {
  amount_pct: number;
  trigger_type: 'next_payroll_run' | 'months_after_start';
  trigger_months?: number | null;
}

export interface CreatePaymentScheduleData {
  employee_id: string;
  name: string;
  schedule_type: 'lump_sum' | 'installments' | 'recurring';
  total_amount: number;
  frequency?: 'monthly' | 'quarterly' | 'annually' | null;
  duration_months?: number | null;
  effective_date?: string | null;
  tranches?: TrancheInput[] | null;
}

export interface TrancheOut {
  tranche_id: string;
  sequence: number;
  amount_pct: number;
  amount: number;
  trigger_type: string;
  trigger_months: number | null;
}

export interface ScheduleConfigOut {
  config_id: string;
  employee_id: string;
  name: string;
  schedule_type: string;
  total_amount: number;
  frequency: string | null;
  duration_months: number | null;
  created_at: string;
  tranches: TrancheOut[];
}

export interface ScheduleWithPayoutsOut {
  config: ScheduleConfigOut;
  payouts_generated: number;
}

export const createPaymentSchedule = (data: CreatePaymentScheduleData) =>
  http<ScheduleWithPayoutsOut>('/payment-schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const useCreatePaymentSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPaymentSchedule,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['employee-payouts', variables.employee_id] });
    },
  });
};

// ---- Payment Obligations ----

export interface ObligationPayout {
  payout_id: string;
  group_id: string;
  amount: number;
  date: string;
  status: string;
}

export interface ObligationEmployee {
  employee_id: string;
  name: string;
  role: string;
  department: string;
  obligation_count: number;
  outstanding: number;
  paid: number;
  payouts: ObligationPayout[];
}

export interface ObligationSummary {
  total_outstanding: number;
  total_paid: number;
  scheduled_count: number;
  paid_count: number;
}

export interface PaymentObligationsData {
  summary: ObligationSummary;
  employees: ObligationEmployee[];
}

export const fetchPaymentObligations = () =>
  http<PaymentObligationsData>('/payment-obligations');

export const usePaymentObligations = () =>
  useQuery({ queryKey: ['payment-obligations'], queryFn: fetchPaymentObligations });
