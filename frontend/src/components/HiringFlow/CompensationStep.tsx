import type { WizardState } from './HiringFlow.types';
import { COMPENSATION_DEFAULTS, formatCurrency } from './HiringFlow.types';
import {
  StepContainer,
  SectionTitle,
  SectionSubtitle,
  FormGrid,
  FormField,
  FieldLabel,
  TextInput,
  SubHeading,
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
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onContinue: () => void;
}

export function CompensationStep({ state, onChange, onContinue }: CompensationStepProps) {
  const comp = COMPENSATION_DEFAULTS;
  const { employeeName, employeeDepartment, employeeRole, employeeStartDate, hasUpFrontPayments } = state;

  const canContinue =
    hasUpFrontPayments === true &&
    employeeName.trim().length > 0 &&
    employeeStartDate.length > 0;

  return (
    <StepContainer>
      <SectionTitle>Compensation</SectionTitle>
      <SectionSubtitle>
        Configure compensation for the new hire. This information will be included in their offer letter.
      </SectionSubtitle>

      <SubHeading style={{ marginTop: 0 }}>Employee Details</SubHeading>
      <FormGrid>
        <FormField>
          <FieldLabel>Full Name</FieldLabel>
          <TextInput
            value={employeeName}
            onChange={(e) => onChange({ employeeName: e.target.value })}
            placeholder="Sarah Chen"
          />
        </FormField>
        <FormField>
          <FieldLabel>Role</FieldLabel>
          <TextInput
            value={employeeRole}
            onChange={(e) => onChange({ employeeRole: e.target.value })}
            placeholder="Senior Software Engineer"
          />
        </FormField>
        <FormField>
          <FieldLabel>Department</FieldLabel>
          <TextInput
            value={employeeDepartment}
            onChange={(e) => onChange({ employeeDepartment: e.target.value })}
            placeholder="Engineering"
          />
        </FormField>
        <FormField>
          <FieldLabel>Start Date</FieldLabel>
          <TextInput
            type="date"
            value={employeeStartDate}
            onChange={(e) => onChange({ employeeStartDate: e.target.value })}
          />
        </FormField>
      </FormGrid>

      <SubHeading>Compensation Package</SubHeading>
      <DetailRow>
        <DetailLabel>Annual Salary</DetailLabel>
        <DetailValue>{formatCurrency(comp.annualSalary)}</DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>Equity Grant</DetailLabel>
        <DetailValue>
          {comp.equityOptions.toLocaleString()} options · {comp.equityVestYears}-year vest, {comp.equityCliffYears}-year cliff
        </DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>Target Bonus</DetailLabel>
        <DetailValue>{comp.targetBonusPercent}% of base salary</DetailValue>
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
            onChange={() => onChange({ hasUpFrontPayments: true })}
          />
          Yes, they will have up-front payments
        </RadioOption>
        <RadioOption $selected={hasUpFrontPayments === false}>
          <input
            type="radio"
            name="upfront"
            checked={hasUpFrontPayments === false}
            onChange={() => onChange({ hasUpFrontPayments: false })}
          />
          No, they will not have any up-front payments
        </RadioOption>
      </QuestionBlock>

      <ActionRow>
        <PrimaryButton disabled={!canContinue} onClick={onContinue}>
          Continue
        </PrimaryButton>
      </ActionRow>
    </StepContainer>
  );
}
