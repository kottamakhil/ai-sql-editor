import type { WizardState } from './HiringFlow.types';
import {
  COMPENSATION_DEFAULTS,
  formatCurrency,
  TRIGGER_LABELS,
  FREQUENCY_LABELS,
  generateRecurringTranches,
  getFrequencyPaymentsPerYear,
} from './HiringFlow.types';
import {
  StepContainer,
  SectionTitle,
  SectionSubtitle,
  ReviewCard,
  CardHeader,
  Avatar,
  HeaderInfo,
  HeaderName,
  HeaderRole,
  DetailRow,
  DetailLabel,
  DetailValue,
  ObligationCard,
  ObligationHeader,
  ObligationTitle,
  Badge,
  BadgeRow,
  InfoBox,
  InfoTitle,
  InfoText,
  ActionRow,
  PrimaryButton,
  SecondaryButton,
} from './ReviewStep.styles';

interface ReviewStepProps {
  state: WizardState;
  onBack: () => void;
  onSendOffer: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const SCHEDULE_LABEL: Record<string, string> = {
  lump_sum: 'Lump Sum',
  installments: 'Installments',
  recurring: 'Recurring',
};

export function ReviewStep({ state, onBack, onSendOffer, isSubmitting, error }: ReviewStepProps) {
  const comp = COMPENSATION_DEFAULTS;
  const { employeeName, employeeRole, employeeDepartment, calculationAmount, scheduleType, tranches, recurringFrequency, recurringDurationYears } = state;

  const effectiveTranches = scheduleType === 'recurring'
    ? generateRecurringTranches(recurringFrequency, recurringDurationYears)
    : scheduleType === 'lump_sum'
      ? [{ id: 'lump', amountPercent: 100, trigger: 'next_payroll_run' as const }]
      : tranches;

  const paymentCount = effectiveTranches.length;
  const totalPayments = scheduleType === 'recurring'
    ? getFrequencyPaymentsPerYear(recurringFrequency) * recurringDurationYears
    : paymentCount;

  function getTriggerSummary() {
    if (scheduleType === 'lump_sum') return 'Next payroll run';
    if (scheduleType === 'recurring') return `${FREQUENCY_LABELS[recurringFrequency]}, ${recurringDurationYears} year${recurringDurationYears !== 1 ? 's' : ''}`;
    const triggers = tranches.map((t) => {
      let s = TRIGGER_LABELS[t.trigger];
      if (t.trigger === 'months_after_start' && t.monthsAfterStart) {
        s += ` (${t.monthsAfterStart}mo)`;
      }
      return s;
    });
    return [...new Set(triggers)].join(', ');
  }

  return (
    <StepContainer>
      <SectionTitle>Review Offer</SectionTitle>
      <SectionSubtitle>
        Confirm the details below before sending the offer to {employeeName || 'the employee'}.
      </SectionSubtitle>

      <ReviewCard>
        <CardHeader>
          <Avatar>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Avatar>
          <HeaderInfo>
            <HeaderName>{employeeName}</HeaderName>
            <HeaderRole>{employeeRole}{employeeRole && employeeDepartment ? ' · ' : ''}{employeeDepartment}</HeaderRole>
          </HeaderInfo>
        </CardHeader>
        <DetailRow>
          <DetailLabel>Annual Salary</DetailLabel>
          <DetailValue>{formatCurrency(comp.annualSalary)}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Equity</DetailLabel>
          <DetailValue>
            {comp.equityOptions.toLocaleString()} options ({comp.equityVestYears}y vest, {comp.equityCliffYears}y cliff)
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Target Bonus</DetailLabel>
          <DetailValue>{comp.targetBonusPercent}% of base</DetailValue>
        </DetailRow>
      </ReviewCard>

      <ObligationCard>
        <ObligationHeader>
          <ObligationTitle>Sign-On Bonus — Payment Obligations</ObligationTitle>
          <BadgeRow>
            <Badge $color="green">{totalPayments} Payment{totalPayments !== 1 ? 's' : ''}</Badge>
            <Badge>{SCHEDULE_LABEL[scheduleType]}</Badge>
          </BadgeRow>
        </ObligationHeader>
        <DetailRow>
          <DetailLabel>Amount</DetailLabel>
          <DetailValue>{formatCurrency(calculationAmount)}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Schedule</DetailLabel>
          <DetailValue>{getTriggerSummary()}</DetailValue>
        </DetailRow>
      </ObligationCard>

      <InfoBox>
        <InfoTitle>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          What happens next
        </InfoTitle>
        <InfoText>
          When {employeeName || 'the employee'} accepts the offer, {totalPayments} payment obligation{totalPayments !== 1 ? 's' : ''} will
          be created for the {formatCurrency(calculationAmount)} sign-on bonus.
          {scheduleType === 'recurring'
            ? ` Payments will recur ${FREQUENCY_LABELS[recurringFrequency]} for ${recurringDurationYears} year${recurringDurationYears !== 1 ? 's' : ''}.`
            : scheduleType === 'installments'
              ? ` Payments will be distributed across ${tranches.length} installment${tranches.length !== 1 ? 's' : ''}.`
              : ' Payment will be made in a single lump sum.'}
        </InfoText>
      </InfoBox>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      <ActionRow>
        <SecondaryButton onClick={onBack} disabled={isSubmitting}>Back</SecondaryButton>
        <PrimaryButton onClick={onSendOffer} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Send Offer'}
        </PrimaryButton>
      </ActionRow>
    </StepContainer>
  );
}
