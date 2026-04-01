import type { WizardState } from './HiringFlow.types';
import {
  HARDCODED_EMPLOYEE,
  formatCurrency,
  getFrequencyPaymentsPerYear,
} from './HiringFlow.types';
import {
  StepContainer,
  CheckCircle,
  Heading,
  SubText,
  ActionRow,
  PrimaryButton,
  SecondaryButton,
} from './CompleteStep.styles';

interface CompleteStepProps {
  state: WizardState;
  onViewObligations: () => void;
  onAddAnother: () => void;
}

export function CompleteStep({ state, onViewObligations, onAddAnother }: CompleteStepProps) {
  const { calculationAmount, scheduleType, recurringFrequency, recurringDurationYears } = state;

  const paymentCount = scheduleType === 'recurring'
    ? getFrequencyPaymentsPerYear(recurringFrequency) * recurringDurationYears
    : scheduleType === 'installments'
      ? state.tranches.length
      : 1;

  return (
    <StepContainer>
      <CheckCircle>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </CheckCircle>
      <Heading>Offer Sent to {HARDCODED_EMPLOYEE.name}</Heading>
      <SubText>
        {paymentCount} payment obligation{paymentCount !== 1 ? 's' : ''} {paymentCount !== 1 ? 'have' : 'has'} been
        created for the {formatCurrency(calculationAmount)} sign-on bonus.
      </SubText>
      <ActionRow>
        <PrimaryButton onClick={onViewObligations}>View Obligations</PrimaryButton>
        <SecondaryButton onClick={onAddAnother}>Add Another Employee</SecondaryButton>
      </ActionRow>
    </StepContainer>
  );
}
