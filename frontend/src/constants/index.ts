export const PLAN_TYPES = {
  RECURRING: 'RECURRING',
  ONE_TIME: 'ONE_TIME',
} as const;

export const FREQUENCIES = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUALLY: 'ANNUALLY',
} as const;

export const PLAN_MODES = {
  AI_ASSISTED: 'AI_ASSISTED',
  MANUAL: 'MANUAL',
} as const;

export const SUGGESTION_CHIPS = [
  { label: 'Sales Commission Plan', icon: 'sparkle' },
  { label: 'Performance Bonus', icon: 'sparkle' },
  { label: 'Annual Grant', icon: 'sparkle' },
] as const;

export const FEATURE_FLAGS = {
  ENABLE_SALESFORCE_CONNECT: true,
  ENABLE_APPROVALS: true,
  ENABLE_DISPUTES: true,
} as const;
