import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WizardState } from '../../components/HiringFlow/HiringFlow.types';
import { DEFAULT_WIZARD_STATE, createTranche } from '../../components/HiringFlow/HiringFlow.types';
import { Stepper } from '../../components/HiringFlow/Stepper';
import { CompensationSidebar } from '../../components/HiringFlow/CompensationSidebar';
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
  PageWrapper,
  TopBar,
  Logo,
  AppName,
  SearchWrapper,
  SearchBar,
  RightIcons,
  IconBtn,
  CompanyName,
  AvatarCircle,
  Body,
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
    <PageWrapper>
      <TopBar>
        <Logo>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </Logo>
        <AppName>
          Compensation
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </AppName>

        <SearchWrapper>
          <SearchBar>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            Search or jump to...
          </SearchBar>
        </SearchWrapper>

        <RightIcons>
          <IconBtn title="Help">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" />
              <circle cx="12" cy="17" r=".5" fill="currentColor" />
            </svg>
          </IconBtn>
          <IconBtn title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </IconBtn>
          <IconBtn title="Apps">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </IconBtn>
          <IconBtn title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </IconBtn>
          <CompanyName>Acme, Inc.</CompanyName>
          <AvatarCircle>W</AvatarCircle>
        </RightIcons>
      </TopBar>

      <Body>
        <CompensationSidebar />
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
      </Body>
    </PageWrapper>
  );
}
