export const ARTIFACT_LABELS: Record<string, string> = {
  payout: 'Payouts',
  commissions: 'Commissions',
  commission_calc: 'Commissions',
  commission_detail: 'Commissions',
  commission_base: 'Commissions',
  deal_commissions: 'Commissions',
  quarterly_commissions: 'Commissions',
  monthly_commissions: 'Commissions',
  eligible_employees: 'Recipients',
  quota_base: 'Recipients',
  employee_commission_rates: 'Recipients',
  attainment: 'Attainment',
  quota_attainment: 'Attainment',
  monthly_attainment: 'Attainment',
  attainment_base: 'Attainment',
  performance: 'Attainment',
  eligible_deals: 'Eligible deals',
  commissionable_deals: 'Eligible deals',
  base_deals: 'Deals',
  closed_won_deals: 'Deals',
  closed_deals: 'Deals',
  monthly_deals: 'Deals',
  monthly_closed_deals: 'Deals',
  deal_counts: 'Deals',
  accelerator_tiers: 'Accelerators',
  accelerator_table: 'Accelerators',
  monthly_quotas: 'Quotas',
  monthly_quota: 'Quotas',
  bonus_amounts: 'Bonuses',
};

export const ARTIFACT_ORDER: string[] = [
  'payout', 'commissions', 'commission_calc', 'commission_detail',
  'commission_base', 'deal_commissions', 'quarterly_commissions', 'monthly_commissions',
  'eligible_employees', 'quota_base', 'employee_commission_rates',
  'attainment', 'quota_attainment', 'monthly_attainment', 'attainment_base', 'performance',
  'eligible_deals', 'commissionable_deals',
  'base_deals', 'closed_won_deals', 'closed_deals', 'monthly_deals',
  'monthly_closed_deals', 'deal_counts',
  'accelerator_tiers', 'accelerator_table',
  'monthly_quotas', 'monthly_quota',
  'bonus_amounts',
];

export function artifactDisplayName(name: string): string {
  return ARTIFACT_LABELS[name] ?? name;
}

export function isRecipientArtifact(name?: string | null): boolean {
  const label = artifactDisplayName(name ?? '');
  return label === 'Recipients';
}

export function isPayoutArtifact(name?: string | null): boolean {
  const label = artifactDisplayName(name ?? '');
  return label === 'Payouts';
}

export function sortArtifacts<T extends { name?: string | null }>(artifacts: T[]): T[] {
  return [...artifacts].sort((a, b) => {
    const ai = ARTIFACT_ORDER.indexOf(a.name ?? '');
    const bi = ARTIFACT_ORDER.indexOf(b.name ?? '');
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
