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
