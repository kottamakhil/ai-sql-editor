import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  ScheduleType,
  Tranche,
  TriggerType,
  RecurringFrequency,
  WizardState,
} from './HiringFlow.types';
import {
  createTranche,
  generateRecurringTranches,
  formatCurrency,
  TRIGGER_LABELS,
  FREQUENCY_LABELS,
  getFrequencyPaymentsPerYear,
} from './HiringFlow.types';
import {
  StepContainer,
  SectionTitle,
  SectionSubtitle,
  SubHeading,
  FieldRow,
  FieldLabel,
  CurrencyInput,
  ScheduleTabs,
  ScheduleTab,
  TabTitle,
  TabSubtext,
  TrancheCard,
  TrancheHeader,
  TrancheAmount,
  RemoveTrancheBtn,
  TrancheBody,
  TrancheFieldRow,
  TrancheLabel,
  SmallInput,
  UnitLabel,
  DropdownWrapper,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  AddTrancheBtn,
  AllocationBar,
  RecurringConfig,
  ActionRow,
  PrimaryButton,
  SecondaryButton,
  ScheduleHeading,
  PaymentCount,
  DateInput,
} from './PaymentPlanStep.styles';

function Dropdown<T extends string>({
  value,
  options,
  labels,
  onChange,
  disabled,
  width,
}: {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (val: T) => void;
  disabled?: boolean;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <DropdownWrapper ref={ref} style={width ? { width, flex: 'none' } : undefined}>
      <DropdownTrigger
        $open={open}
        $disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        type="button"
      >
        {labels[value]}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </DropdownTrigger>
      {open && !disabled && (
        <DropdownMenu>
          {options.map((opt) => (
            <DropdownItem
              key={opt}
              $active={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {labels[opt]}
              {opt === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </DropdownWrapper>
  );
}

interface PaymentPlanStepProps {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  onContinue: () => void;
}

const TRIGGER_OPTIONS: TriggerType[] = ['next_payroll_run', 'months_after_start', 'specific_date'];
const FREQUENCY_OPTIONS: RecurringFrequency[] = ['monthly', 'quarterly', 'semi-annually', 'annually'];

export function PaymentPlanStep({ state, onChange, onBack, onContinue }: PaymentPlanStepProps) {
  const { calculationAmount, scheduleType, tranches, recurringFrequency, recurringDurationYears } = state;

  const totalPercent = tranches.reduce((s, t) => s + t.amountPercent, 0);
  const allocationValid = Math.abs(totalPercent - 100) < 0.01;

  const recurringTranches = generateRecurringTranches(recurringFrequency, recurringDurationYears);
  const recTotalPayments = getFrequencyPaymentsPerYear(recurringFrequency) * recurringDurationYears;

  const canContinue =
    calculationAmount > 0 &&
    (scheduleType === 'lump_sum' ||
      (scheduleType === 'installments' && allocationValid && tranches.length > 0) ||
      (scheduleType === 'recurring' && recurringTranches.length > 0));

  const updateTranche = (id: string, patch: Partial<Tranche>) => {
    onChange({
      tranches: tranches.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const removeTranche = (id: string) => {
    if (tranches.length <= 1) return;
    onChange({ tranches: tranches.filter((t) => t.id !== id) });
  };

  const addTranche = () => {
    const remaining = Math.max(0, 100 - totalPercent);
    onChange({ tranches: [...tranches, createTranche({ amountPercent: remaining })] });
  };

  return (
    <StepContainer>
      <SectionTitle>Payment Obligation</SectionTitle>
      <SectionSubtitle>
        Configure the payment plan for Sarah Chen. Set type, amount, schedule, and conditions below.
      </SectionSubtitle>

      <SubHeading>Plan Settings</SubHeading>
      <FieldRow>
        <FieldLabel>Calculation</FieldLabel>
        <CurrencyInput>
          <span>$</span>
          <input
            type="number"
            value={calculationAmount || ''}
            onChange={(e) => onChange({ calculationAmount: Number(e.target.value) || 0 })}
            placeholder="20000"
          />
        </CurrencyInput>
      </FieldRow>

      <SubHeading style={{ marginTop: 28 }}>Schedule</SubHeading>
      <ScheduleTabs>
        <ScheduleTab
          $active={scheduleType === 'lump_sum'}
          onClick={() => onChange({ scheduleType: 'lump_sum' })}
        >
          <TabTitle>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
            Lump Sum
          </TabTitle>
          <TabSubtext>Single payment</TabSubtext>
        </ScheduleTab>
        <ScheduleTab
          $active={scheduleType === 'installments'}
          onClick={() => onChange({ scheduleType: 'installments' })}
        >
          <TabTitle>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" strokeLinecap="round" />
            </svg>
            Installments
          </TabTitle>
          <TabSubtext>Custom tranches</TabSubtext>
        </ScheduleTab>
        <ScheduleTab
          $active={scheduleType === 'recurring'}
          onClick={() => onChange({ scheduleType: 'recurring' })}
        >
          <TabTitle>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            Recurring
          </TabTitle>
          <TabSubtext>Repeating schedule</TabSubtext>
        </ScheduleTab>
      </ScheduleTabs>

      {scheduleType === 'lump_sum' && (
        <LumpSumView amount={calculationAmount} />
      )}

      {scheduleType === 'installments' && (
        <InstallmentsView
          tranches={tranches}
          totalAmount={calculationAmount}
          totalPercent={totalPercent}
          allocationValid={allocationValid}
          onUpdate={updateTranche}
          onRemove={removeTranche}
          onAdd={addTranche}
        />
      )}

      {scheduleType === 'recurring' && (
        <RecurringView
          frequency={recurringFrequency}
          durationYears={recurringDurationYears}
          totalAmount={calculationAmount}
          tranches={recurringTranches}
          totalPayments={recTotalPayments}
          onChangeFrequency={(f) => onChange({ recurringFrequency: f })}
          onChangeDuration={(d) => onChange({ recurringDurationYears: d })}
        />
      )}

      <ActionRow>
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <PrimaryButton disabled={!canContinue} onClick={onContinue}>
          Continue
        </PrimaryButton>
      </ActionRow>
    </StepContainer>
  );
}

function LumpSumView({ amount }: { amount: number }) {
  return (
    <>
      <ScheduleHeading>
        <h3>Payment Details</h3>
      </ScheduleHeading>
      <TrancheCard>
        <TrancheHeader>
          <span>Single Payment</span>
          <TrancheAmount>{formatCurrency(amount)}</TrancheAmount>
        </TrancheHeader>
        <TrancheBody>
          <TrancheFieldRow>
            <TrancheLabel>Amount</TrancheLabel>
            <SmallInput type="number" value={100} readOnly />
            <UnitLabel>%</UnitLabel>
          </TrancheFieldRow>
        </TrancheBody>
      </TrancheCard>
    </>
  );
}

interface InstallmentsViewProps {
  tranches: Tranche[];
  totalAmount: number;
  totalPercent: number;
  allocationValid: boolean;
  onUpdate: (id: string, patch: Partial<Tranche>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

function InstallmentsView({
  tranches,
  totalAmount,
  totalPercent,
  allocationValid,
  onUpdate,
  onRemove,
  onAdd,
}: InstallmentsViewProps) {
  return (
    <>
      <ScheduleHeading>
        <h3>Payment Schedule ({tranches.length} Tranches)</h3>
      </ScheduleHeading>
      {tranches.map((tranche, i) => {
        const trancheAmt = Math.round((tranche.amountPercent / 100) * totalAmount);
        return (
          <TrancheCard key={tranche.id}>
            <TrancheHeader>
              <span>Tranche {i + 1}</span>
              <TrancheAmount>
                {formatCurrency(trancheAmt)}
                {tranches.length > 1 && (
                  <RemoveTrancheBtn onClick={() => onRemove(tranche.id)} title="Remove tranche">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </RemoveTrancheBtn>
                )}
              </TrancheAmount>
            </TrancheHeader>
            <TrancheBody>
              <TrancheFieldRow>
                <TrancheLabel>Amount</TrancheLabel>
                <SmallInput
                  type="number"
                  value={tranche.amountPercent}
                  onChange={(e) =>
                    onUpdate(tranche.id, { amountPercent: Number(e.target.value) || 0 })
                  }
                />
                <UnitLabel>%</UnitLabel>
              </TrancheFieldRow>
              <TrancheFieldRow>
                <TrancheLabel>Trigger</TrancheLabel>
                <Dropdown<TriggerType>
                  value={tranche.trigger}
                  options={TRIGGER_OPTIONS}
                  labels={TRIGGER_LABELS}
                  onChange={(val) => onUpdate(tranche.id, { trigger: val })}
                />
              </TrancheFieldRow>
              {tranche.trigger === 'months_after_start' && (
                <TrancheFieldRow>
                  <TrancheLabel />
                  <SmallInput
                    type="number"
                    value={tranche.monthsAfterStart ?? ''}
                    onChange={(e) =>
                      onUpdate(tranche.id, { monthsAfterStart: Number(e.target.value) || 0 })
                    }
                    placeholder="6"
                  />
                  <UnitLabel>months after start</UnitLabel>
                </TrancheFieldRow>
              )}
              {tranche.trigger === 'specific_date' && (
                <TrancheFieldRow>
                  <TrancheLabel />
                  <DateInput
                    type="date"
                    value={tranche.specificDate ?? ''}
                    onChange={(e) =>
                      onUpdate(tranche.id, { specificDate: e.target.value })
                    }
                  />
                </TrancheFieldRow>
              )}
            </TrancheBody>
          </TrancheCard>
        );
      })}
      <AddTrancheBtn onClick={onAdd}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Add tranche
      </AddTrancheBtn>
      <AllocationBar $valid={allocationValid}>
        <span>Total allocation</span>
        <span>
          {Math.round(totalPercent)}% of {formatCurrency(totalAmount)}
        </span>
      </AllocationBar>
    </>
  );
}

interface RecurringViewProps {
  frequency: RecurringFrequency;
  durationYears: number;
  totalAmount: number;
  tranches: Tranche[];
  totalPayments: number;
  onChangeFrequency: (f: RecurringFrequency) => void;
  onChangeDuration: (d: number) => void;
}

function RecurringView({
  frequency,
  durationYears,
  totalAmount,
  tranches,
  totalPayments,
  onChangeFrequency,
  onChangeDuration,
}: RecurringViewProps) {
  const paymentAmount = totalPayments > 0 ? Math.round(totalAmount / totalPayments) : 0;

  return (
    <>
      <RecurringConfig>
        <span>Every</span>
        <Dropdown<RecurringFrequency>
          value={frequency}
          options={FREQUENCY_OPTIONS}
          labels={FREQUENCY_LABELS}
          onChange={onChangeFrequency}
          width={150}
        />
        <span>for</span>
        <SmallInput
          type="number"
          min={1}
          value={durationYears}
          onChange={(e) => onChangeDuration(Math.max(1, Number(e.target.value) || 1))}
        />
        <span>year{durationYears !== 1 ? 's' : ''}</span>
        <PaymentCount>
          ({totalPayments} payment{totalPayments !== 1 ? 's' : ''} of {formatCurrency(paymentAmount)})
        </PaymentCount>
      </RecurringConfig>

      <ScheduleHeading>
        <h3>Payment Schedule ({tranches.length} Tranches)</h3>
      </ScheduleHeading>
      {tranches.map((tranche, i) => {
        const trancheAmt = Math.round((tranche.amountPercent / 100) * totalAmount);
        return (
          <TrancheCard key={tranche.id}>
            <TrancheHeader>
              <span>Tranche {i + 1}</span>
              <TrancheAmount>{formatCurrency(trancheAmt)}</TrancheAmount>
            </TrancheHeader>
            <TrancheBody>
              <TrancheFieldRow>
                <TrancheLabel>Amount</TrancheLabel>
                <SmallInput type="number" value={tranche.amountPercent} readOnly />
                <UnitLabel>%</UnitLabel>
              </TrancheFieldRow>
              <TrancheFieldRow>
                <TrancheLabel>Trigger</TrancheLabel>
                <Dropdown<TriggerType>
                  value={tranche.trigger}
                  options={TRIGGER_OPTIONS}
                  labels={TRIGGER_LABELS}
                  onChange={() => {}}
                  disabled
                />
              </TrancheFieldRow>
              {tranche.trigger === 'months_after_start' && (
                <TrancheFieldRow>
                  <TrancheLabel />
                  <SmallInput type="number" value={tranche.monthsAfterStart ?? 0} readOnly />
                  <UnitLabel>months after start</UnitLabel>
                </TrancheFieldRow>
              )}
            </TrancheBody>
          </TrancheCard>
        );
      })}
      <AllocationBar $valid>
        <span>Total allocation</span>
        <span>100% of {formatCurrency(totalAmount)}</span>
      </AllocationBar>
    </>
  );
}
