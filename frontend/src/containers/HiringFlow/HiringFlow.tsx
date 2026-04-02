import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WizardState } from '../../components/HiringFlow/HiringFlow.types';
import { DEFAULT_WIZARD_STATE, createTranche } from '../../components/HiringFlow/HiringFlow.types';
import { Stepper } from '../../components/HiringFlow/Stepper';
import { CompensationStep } from '../../components/HiringFlow/CompensationStep';
import { PaymentPlanStep } from '../../components/HiringFlow/PaymentPlanStep';
import { ReviewStep } from '../../components/HiringFlow/ReviewStep';
import { CompleteStep } from '../../components/HiringFlow/CompleteStep';
import {
  createEmployee,
  createPaymentSchedule,
  type CreatePaymentScheduleData,
  type TrancheInput,
} from '../../actions/employees';
import {
  MainContent,
  ContentWrapper,
  PageHeading,
} from './HiringFlow.styles';

function buildSchedulePayload(state: WizardState, employeeId: string): CreatePaymentScheduleData {
  const base: CreatePaymentScheduleData = {
    employee_id: employeeId,
    name: 'Sign-On Bonus',
    schedule_type: state.scheduleType,
    total_amount: state.calculationAmount,
  };

  if (state.scheduleType === 'recurring') {
    base.frequency = state.recurringFrequency;
    base.duration_months = state.recurringDurationYears * 12;
  }

  if (state.scheduleType === 'installments') {
    base.tranches = state.tranches.map((t): TrancheInput => ({
      amount_pct: t.amountPercent,
      trigger_type: t.trigger,
      trigger_months: t.trigger === 'months_after_start' ? (t.monthsAfterStart ?? null) : null,
    }));
  }

  if (state.scheduleType === 'lump_sum') {
    base.tranches = [{ amount_pct: 100, trigger_type: 'next_payroll_run' }];
  }

  return base;
}

export function HiringFlow() {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>({ ...DEFAULT_WIZARD_STATE });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetWizard = useCallback(() => {
    setState({
      ...DEFAULT_WIZARD_STATE,
      tranches: [createTranche({ amountPercent: 50 }), createTranche({ amountPercent: 50 })],
    });
    setSubmitError(null);
  }, []);

  const handleSendOffer = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const employee = await createEmployee({
        name: state.employeeName,
        department: state.employeeDepartment || 'General',
        role: state.employeeRole || 'Employee',
        start_date: state.employeeStartDate,
      });

      const schedulePayload = buildSchedulePayload(state, employee.employee_id);
      await createPaymentSchedule(schedulePayload);

      setState((prev) => ({ ...prev, step: 4 }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [state]);

  return (
    <MainContent>
      <ContentWrapper>
        <PageHeading>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>Add New Employee</h1>
        </PageHeading>
        <Stepper currentStep={state.step} />

        {state.step === 1 && (
          <CompensationStep
            state={state}
            onChange={update}
            onContinue={() => update({ step: 2 })}
          />
        )}

        {state.step === 2 && (
          <PaymentPlanStep
            state={state}
            onChange={update}
            onBack={() => update({ step: 1 })}
            onContinue={() => update({ step: 3 })}
          />
        )}

        {state.step === 3 && (
          <ReviewStep
            state={state}
            onBack={() => update({ step: 2 })}
            onSendOffer={handleSendOffer}
            isSubmitting={isSubmitting}
            error={submitError}
          />
        )}

        {state.step === 4 && (
          <CompleteStep
            state={state}
            onViewObligations={() => navigate('/variable-compensation/plans')}
            onAddAnother={resetWizard}
          />
        )}
      </ContentWrapper>
    </MainContent>
  );
}
