import type { Plan } from './types';

export const MOCK_RECENT_PLANS: Pick<Plan, 'plan_id' | 'name'>[] = [
  { plan_id: 'p001', name: 'Core NAMER ENT Commission' },
  { plan_id: 'p002', name: 'Channel EMEA Broker Ramp' },
  { plan_id: 'p003', name: 'Core EMEA MM Bonus' },
  { plan_id: 'p004', name: 'Product APAC Global IT Plan' },
  { plan_id: 'p005', name: 'Core NAMER SMB Commission' },
  { plan_id: 'p006', name: 'Channel NAMER Accountant Incentive' },
  { plan_id: 'p007', name: 'Product EMEA NLS Attach Plan' },
  { plan_id: 'p008', name: 'Emerging LATAM Expansion' },
  { plan_id: 'p009', name: 'Core APAC STRAT Quota' },
  { plan_id: 'p010', name: 'Channel EMEA Senior Broker Override' },
  { plan_id: 'p011', name: 'Company-wide Bonus' },
  { plan_id: 'p012', name: 'FlexCash-2026' },
];

export const MOCK_NAV_BADGES = {
  approvals: 3,
  disputes: 1,
} as const;
