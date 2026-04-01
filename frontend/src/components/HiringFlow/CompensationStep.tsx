import { HARDCODED_EMPLOYEE, formatCurrency } from './HiringFlow.types';
import {
  StepContainer,
  SectionTitle,
  SectionSubtitle,
  EmployeeCard,
  Avatar,
  EmployeeInfo,
  EmployeeName,
  EmployeeRole,
  DetailRow,
  DetailLabel,
  DetailValue,
  QuestionBlock,
  QuestionText,
  RadioOption,
  ActionRow,
  PrimaryButton,
} from './CompensationStep.styles';

interface CompensationStepProps {
  hasUpFrontPayments: boolean | null;
  onChangeUpFront: (val: boolean) => void;
  onContinue: () => void;
}

export function CompensationStep({ hasUpFrontPayments, onChangeUpFront, onContinue }: CompensationStepProps) {
  const emp = HARDCODED_EMPLOYEE;

  return (
    <StepContainer>
      <SectionTitle>Compensation</SectionTitle>
      <SectionSubtitle>
        Configure compensation for the new hire. This information will be included in their offer letter.
      </SectionSubtitle>

      <EmployeeCard>
        <Avatar>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Avatar>
        <EmployeeInfo>
          <EmployeeName>{emp.name}</EmployeeName>
          <EmployeeRole>{emp.role} · {emp.department}</EmployeeRole>
        </EmployeeInfo>
      </EmployeeCard>

      <DetailRow>
        <DetailLabel>Annual Salary</DetailLabel>
        <DetailValue>{formatCurrency(emp.annualSalary)}</DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>Equity Grant</DetailLabel>
        <DetailValue>
          {emp.equityOptions.toLocaleString()} options · {emp.equityVestYears}-year vest, {emp.equityCliffYears}-year cliff
        </DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>Target Bonus</DetailLabel>
        <DetailValue>{emp.targetBonusPercent}% of base salary</DetailValue>
      </DetailRow>

      <QuestionBlock>
        <QuestionText>
          Will this person receive any up-front payments such as a signing or relocation bonus?
        </QuestionText>
        <RadioOption $selected={hasUpFrontPayments === true}>
          <input
            type="radio"
            name="upfront"
            checked={hasUpFrontPayments === true}
            onChange={() => onChangeUpFront(true)}
          />
          Yes, they will have up-front payments
        </RadioOption>
        <RadioOption $selected={hasUpFrontPayments === false}>
          <input
            type="radio"
            name="upfront"
            checked={hasUpFrontPayments === false}
            onChange={() => onChangeUpFront(false)}
          />
          No, they will not have any up-front payments
        </RadioOption>
      </QuestionBlock>

      <ActionRow>
        <PrimaryButton
          disabled={hasUpFrontPayments !== true}
          onClick={onContinue}
        >
          Continue
        </PrimaryButton>
      </ActionRow>
    </StepContainer>
  );
}
